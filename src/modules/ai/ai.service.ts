import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { LlmFactory } from './llm/llm.factory';
import { Llm } from './llm/llm.interface';
import { z } from 'zod';
import { zodSchemaToPromptDescription } from '../../utils/zod-schema-to-prompt';
import {
  vertexSchemaToZod,
  zodToVertexSchema,
} from '@techery/zod-to-vertex-schema';
import { CallbackHandler } from 'langfuse-langchain';
import { ContractSummarySchema } from './schema/summary.schema';
import { Langfuse } from 'langfuse';
import { AnalysisSchema } from './schema/analysis.schema';
import {
  StateGraph,
  Annotation,
  START,
  END,
  MemorySaver,
} from '@langchain/langgraph';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { Milvus } from '@langchain/community/vectorstores/milvus';
import neo4j, { Driver } from 'neo4j-driver';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { CustomVoyageEmbeddings } from '../../utils/voyage-embeddings';
import { AllConfigType } from '../../config/config.type';

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
  private readonly llm: Llm;
  private readonly textSplitter: RecursiveCharacterTextSplitter;
  private readonly langfuseHandler!: CallbackHandler;
  private readonly langfuse: Langfuse;
  private milvusClient!: MilvusClient;
  private vectorStore!: Milvus;
  private neo4jDriver!: Driver;
  private chatGraphs: Map<string, any> = new Map(); // contractId -> compiled LangGraph
  private checkpointers: Map<string, any> = new Map(); // contractId -> MemorySaver
  private llmProvider!: string | undefined;

  constructor(
    private readonly llmFactory: LlmFactory,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.llm = this.llmFactory.getLlm();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', ' ', ''],
    });

    // Validate Langfuse configuration
    const langfusePublicKey = this.configService.get<string>(
      'langfuse.publicKey',
      { infer: true },
    );
    const langfuseSecretKey = this.configService.get<string>(
      'langfuse.secretKey',
      { infer: true },
    );
    const langfuseBaseUrl = this.configService.get<string>('langfuse.baseUrl', {
      infer: true,
    });

    if (!langfusePublicKey || !langfuseSecretKey) {
      throw new Error(
        'Missing required Langfuse configuration (publicKey, secretKey)',
      );
    }

    // Initialize Langfuse callback handler
    this.langfuseHandler = new CallbackHandler({
      publicKey: langfusePublicKey,
      secretKey: langfuseSecretKey,
      baseUrl: langfuseBaseUrl,
    });
    this.langfuse = new Langfuse({
      publicKey: langfusePublicKey,
      secretKey: langfuseSecretKey,
      baseUrl: langfuseBaseUrl,
    });
    this.llmProvider = this.configService.get<string>('ai.provider', {
      infer: true,
    });
  }

  onModuleInit() {
    // Validate required environment variables
    const milvusAddress = this.configService.get('milvus.address', {
      infer: true,
    });
    const voyageApiKey = this.configService.get('voyage.apiKey', {
      infer: true,
    });
    const milvusCollection = this.configService.get('milvus.collection', {
      infer: true,
    });
    const neo4jUri = this.configService.get('neo4j.uri', {
      infer: true,
    });
    const neo4jUser = this.configService.get('neo4j.user', {
      infer: true,
    });
    const neo4jPassword = this.configService.get('neo4j.password', {
      infer: true,
    });

    const missingVars: string[] = [];
    if (!milvusAddress) missingVars.push('MILVUS_ADDRESS');
    if (!voyageApiKey) missingVars.push('VOYAGE_API_KEY');
    if (!milvusCollection) missingVars.push('MILVUS_COLLECTION');
    if (!neo4jUri) missingVars.push('NEO4J_URI');
    if (!neo4jUser) missingVars.push('NEO4J_USER');
    if (!neo4jPassword) missingVars.push('NEO4J_PASSWORD');
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    try {
      // Initialize Milvus
      this.milvusClient = new MilvusClient({
        address: milvusAddress as string,
      });

      this.vectorStore = new Milvus(
        new CustomVoyageEmbeddings({
          apiKey: voyageApiKey as string,
        }),
        {
          collectionName: milvusCollection as string,
          clientConfig: this.milvusClient.config,
        },
      );

      // Initialize Neo4j
      this.neo4jDriver = neo4j.driver(
        neo4jUri as string,
        neo4j.auth.basic(neo4jUser as string, neo4jPassword as string),
      );
    } catch (error) {
      // Log the error and fail fast
      console.error('Error during AiService initialization:', error);
      throw new Error(
        'Failed to initialize AiService: ' +
          (error instanceof Error ? error.message : error),
      );
    }
  }

  private getSchemaAsPerLLMProvider(schema: z.ZodType<any>) {
    if (this.llmProvider === 'gemini') {
      return zodToVertexSchema(schema);
    }
    return schema;
  }

  private async invokeWithSchema<T>(
    schema: z.ZodType<T> | string,
    prompt: PromptTemplate | string,
    inputVars: Record<string, any>,
    options?: { skipSchemaDescription?: boolean },
  ): Promise<T> {
    let result: any;
    const schemaDescription = options?.skipSchemaDescription
      ? undefined
      : typeof schema === 'string'
        ? schema
        : zodSchemaToPromptDescription(schema);

    const promptTemplate =
      typeof prompt === 'string' ? PromptTemplate.fromTemplate(prompt) : prompt;
    if (typeof (this.llm as any).model?.withStructuredOutput === 'function') {
      const modelWithSchema = (this.llm as any).model.withStructuredOutput(
        this.getSchemaAsPerLLMProvider(schema as z.ZodType<T>),
      );
      // Render the prompt with inputVars
      const renderedPrompt = await promptTemplate.format({
        ...inputVars,
        ...(schemaDescription ? { schemaDescription: schemaDescription } : {}),
      });
      result = await modelWithSchema.invoke(renderedPrompt, {
        callbacks: [this.langfuseHandler],
      });
    } else {
      const chain = promptTemplate
        .pipe((this.llm as any).model)
        .pipe(new StringOutputParser());

      const raw = await chain.invoke(
        { ...inputVars, ...(schemaDescription ? { schemaDescription } : {}) },
        { callbacks: [this.langfuseHandler] },
      );
      try {
        const zodSchema = vertexSchemaToZod(JSON.parse(raw));
        result = zodSchema.safeParse(zodSchema.parse(JSON.parse(raw)));
      } catch (e) {
        throw new Error('Failed to parse result: ' + e);
      }
    }
    return result;
  }

  private async analyzeChunk(
    doc: Document,
    contractType: string,
  ): Promise<z.infer<typeof AnalysisSchema>> {
    const contractAnalysisPrompt = await this.langfuse.getPrompt(
      'contract-analysis-prompt',
    );
    const prompt = PromptTemplate.fromTemplate(contractAnalysisPrompt.prompt);
    const result = await this.invokeWithSchema<z.infer<typeof AnalysisSchema>>(
      AnalysisSchema,
      prompt,
      {
        contractType: contractType,
        text: doc.pageContent,
      },
    );
    return result;
  }

  async analyzeContract(
    text: string,
    contractType: string,
  ): Promise<{
    clauses: z.infer<typeof AnalysisSchema>['clauses'];
    risks: z.infer<typeof AnalysisSchema>['risks'];
    summary: z.infer<typeof ContractSummarySchema>;
  }> {
    // Split the contract into chunks
    const docs = await this.textSplitter.createDocuments([text]);

    // Analyze each chunk for clauses and risks
    const analysisResults = await Promise.all(
      docs.map((doc) => this.analyzeChunk(doc, contractType)),
    );

    // Combine results
    const clauses = analysisResults.flatMap((result) => result.clauses);
    const risks = analysisResults.flatMap((result) => result.risks);

    // Generate overall summary
    const summary = await this.generateSummary(text);

    return {
      clauses,
      risks,
      summary,
    };
  }

  public async generateSummary(
    text: string,
  ): Promise<z.infer<typeof ContractSummarySchema>> {
    const prompt = PromptTemplate.fromTemplate(
      (await this.langfuse.getPrompt('contract-summary')).prompt,
    );
    return this.invokeWithSchema<z.infer<typeof ContractSummarySchema>>(
      ContractSummarySchema,
      prompt,
      {
        text,
      },
      { skipSchemaDescription: true },
    );
  }

  async answerQuestion(
    question: string,
    context: string,
  ): Promise<{ answer: string; confidence: number }> {
    const AnswerSchema = z.object({
      answer: z.string().describe("The answer to the user's question"),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe('Confidence score between 0 and 1'),
    });
    const prompt = PromptTemplate.fromTemplate(`
      Answer the following question based on the provided contract context.
      If you cannot find a definitive answer in the context, say so.

      Context: {context}
      Question: {question}

      Provide your answer in JSON format with the following schema:
      ${zodSchemaToPromptDescription(AnswerSchema)}
    `);
    return this.invokeWithSchema<z.infer<typeof AnswerSchema>>(
      AnswerSchema,
      prompt,
      { context, question },
    );
  }

  async compareWithTemplate(
    clauseText: string,
    templateText: string,
  ): Promise<{
    differences: string[];
    suggestedChanges: string[];
    riskLevel: string;
  }> {
    const CompareSchema = z.object({
      differences: z
        .array(
          z
            .string()
            .describe('A key difference between the clause and the template'),
        )
        .describe('List of key differences'),
      suggestedChanges: z
        .array(
          z.string().describe('A suggested change to align with the template'),
        )
        .describe('List of suggestions'),
      riskLevel: z
        .enum(['LOW', 'MEDIUM', 'HIGH'])
        .describe('Overall risk level'),
    });
    const prompt = PromptTemplate.fromTemplate(`
      Compare the following clause with the template clause and identify:
      1. Key differences
      2. Suggested changes to align with the template
      3. Overall risk level (LOW/MEDIUM/HIGH)

      Clause Text: {clauseText}
      Template Text: {templateText}

      Provide the analysis in JSON format with the following schema:
      ${zodSchemaToPromptDescription(CompareSchema)}
    `);
    return this.invokeWithSchema<z.infer<typeof CompareSchema>>(
      CompareSchema,
      prompt,
      { clauseText, templateText },
    );
  }

  async extractClauses(text: string, contractType: string) {
    const ClauseSchema = z.object({
      title: z.string(),
      clauseType: z.string(),
      text: z.string(),
      riskScore: z.enum(['Low', 'Medium', 'High']),
      riskJustification: z.string(),
      entities: z.array(z.string()).optional(),
      amounts: z.array(z.string()).optional(),
      dates: z.array(z.string()).optional(),
      legalReferences: z.array(z.string()).optional(),
    });
    const prompt = (await this.langfuse.getPrompt('extract-clause')).prompt;
    return this.invokeWithSchema<z.infer<typeof ClauseSchema>[]>(
      z.array(ClauseSchema),
      prompt,
      { text, contractType },
    );
  }

  // State definition for LangGraph
  private static AgentState = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
      reducer: (x, y) => x.concat(y),
      default: () => [],
    }),
    contractId: Annotation<string>(),
    context: Annotation<string>(),
  });

  // Node: Retrieve context from Milvus and Neo4j
  private retrieveContextNode = async (state: any) => {
    const lastUserMsg = state.messages[state.messages.length - 1];
    const contractId = state.contractId;
    // 1. Semantic search in Milvus
    // NOTE: If filter is not supported in this version, remove and filter manually or add a TODO.
    let milvusResults;
    try {
      milvusResults = await this.vectorStore.similaritySearch(
        lastUserMsg.content,
        5,
        // { filter: { contractId } }, // Uncomment if supported
      );
      // If filter is not supported, filter results manually:
      milvusResults = milvusResults.filter(
        (r: any) => r.metadata?.contractId === contractId,
      );
    } catch {
      milvusResults = [];
    }
    // 2. Fetch metadata from Neo4j for the top results
    const clauseIds = milvusResults.map((r: any) => r.metadata.id);
    let context = '';
    if (clauseIds.length > 0) {
      const session = this.neo4jDriver.session();
      try {
        const res = await session.run(
          'MATCH (c:Clause) WHERE c.id IN $ids RETURN c',
          { ids: clauseIds },
        );
        context = res.records
          .map((rec) => rec.get('c').properties.text)
          .join('\n---\n');
      } finally {
        await session.close();
      }
    }
    return { context };
  };

  // Node: Generate answer using LLM
  private generateAnswerNode = async (state: any) => {
    const lastUserMsg = state.messages[state.messages.length - 1];
    const context = state.context;
    const prompt = `You are a contract Q&A assistant. Use the following context from the contract to answer the user's question.\n\nContext:\n${context}\n\nQuestion: ${lastUserMsg.content}\n\nIf the answer is not in the context, say so.`;
    const llm = this.llmFactory.getLlm();
    const answer = await llm.invoke(prompt);
    return { messages: [new AIMessage(answer)] };
  };

  // Build and cache a LangGraph chat agent per contract
  private getOrCreateChatGraph(contractId: string) {
    if (this.chatGraphs.has(contractId)) {
      return this.chatGraphs.get(contractId);
    }
    const checkpointer = new MemorySaver();
    const graph = new StateGraph(AiService.AgentState)
      .addNode('retrieve_context', this.retrieveContextNode)
      .addNode('generate_answer', this.generateAnswerNode)
      .addEdge(START, 'retrieve_context')
      .addEdge('retrieve_context', 'generate_answer')
      .addEdge('generate_answer', END)
      .compile({ checkpointer });
    this.chatGraphs.set(contractId, graph);
    this.checkpointers.set(contractId, checkpointer);
    return graph;
  }

  // Start a new chat session for a contract (returns session/thread id)
  async startChatSession(contractId: string): Promise<string> {
    // For now, contractId is the session id (can be extended for multi-session per contract)
    await this.getOrCreateChatGraph(contractId);
    return contractId;
  }

  // Send a user message and get the agent's answer (returns full message history)
  async chatWithContract(
    contractId: string,
    userMessage: string,
  ): Promise<BaseMessage[]> {
    const graph = this.getOrCreateChatGraph(contractId);
    const state = {
      messages: [new HumanMessage(userMessage)],
      contractId,
      context: '',
    };
    const result = await graph.invoke(state, {
      configurable: { thread_id: contractId },
    });
    return result.messages;
  }

  // Stream agent responses (for WebSocket integration)
  async *streamChatWithContract(contractId: string, userMessage: string) {
    const graph = this.getOrCreateChatGraph(contractId);
    const state = {
      messages: [new HumanMessage(userMessage)],
      contractId,
      context: '',
    };
    const stream = await graph.stream(state, {
      configurable: { thread_id: contractId },
      streamMode: 'updates',
    });
    for await (const update of stream) {
      yield update;
    }
  }

  /**
   * Split contract text into clauses using Gemini if available, otherwise fallback to textSplitter.
   */
  async splitIntoClauses(text: string): Promise<string[]> {
    const prompt = `Split the following contract text into individual clauses. Each clause should be a complete, self-contained unit of the contract. Return the clauses as a JSON array of strings. Contract text: ${text}`;
    try {
      const llm = this.llmFactory.getLlm();
      const result = await llm.invoke(prompt);
      return JSON.parse(result);
    } catch {
      // Fallback to basic splitting if AI fails
      return this.textSplitter.splitText(text);
    }
  }

  /**
   * Analyze a single clause using Gemini if available, otherwise fallback to OpenAI (llmFactory).
   */
  async analyzeClause(clause: string): Promise<{
    type: string;
    risks: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      suggestedResolution: string;
    }>;
  }> {
    const prompt = `Analyze the following contract clause and identify: 1. The type of clause (e.g., "Termination", "Confidentiality", "Indemnification") 2. Any potential risks or issues, including: - Type of risk - Severity (LOW, MEDIUM, or HIGH) - Description of the risk - Suggested resolution. Return the analysis as a JSON object with the following structure: { "type": "string", "risks": [ { "type": "string", "severity": "LOW" | "MEDIUM" | "HIGH", "description": "string", "suggestedResolution": "string" } ] } Clause: ${clause}`;
    try {
      const llm = this.llmFactory.getLlm();
      const result = await llm.invoke(prompt);
      return JSON.parse(result);
    } catch {
      return {
        type: 'Unknown',
        risks: [],
      };
    }
  }

  async onModuleDestroy() {
    // Close Neo4j connection
    if (this.neo4jDriver) {
      await this.neo4jDriver.close();
    }

    // Close Milvus connection if needed
    if (
      this.milvusClient &&
      typeof this.milvusClient.closeConnection === 'function'
    ) {
      await this.milvusClient.closeConnection();
    }

    // Clear chat resources
    this.chatGraphs.clear();
    this.checkpointers.clear();
  }
}
