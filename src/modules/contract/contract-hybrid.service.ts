import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { Milvus } from '@langchain/community/vectorstores/milvus';
import { z } from 'zod';
import scribe from 'scribe.js-ocr';
import { Document } from 'langchain/document';
import { CustomVoyageEmbeddings } from '../../utils/voyage-embeddings';
import { AiService } from '../ai/ai.service';
import { ClauseSchema } from '../ai/schema/clause.schema';

@Injectable()
export class ContractHybridService implements OnModuleInit {
  private driver!: Driver;
  private milvusClient!: MilvusClient;
  private vectorStore!: Milvus;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {}

  onModuleInit() {
    this.driver = neo4j.driver(
      this.configService.get<string>('NEO4J_URI', { infer: true }) ||
        'bolt://localhost:7687',
      neo4j.auth.basic(
        this.configService.get<string>('NEO4J_USER', { infer: true }) ||
          'neo4j',
        this.configService.get<string>('NEO4J_PASSWORD', { infer: true }) ||
          'neo4j',
      ),
    );

    this.milvusClient = new MilvusClient({
      address:
        this.configService.get<string>('MILVUS_ADDRESS', { infer: true }) ||
        'localhost:19530',
    });

    this.vectorStore = new Milvus(
      new CustomVoyageEmbeddings({
        apiKey:
          this.configService.get<string>('VOYAGE_API_KEY', { infer: true }) ||
          '',
      }),
      {
        collectionName:
          this.configService.get<string>('MILVUS_COLLECTION', {
            infer: true,
          }) || 'clauses',
        clientConfig: this.milvusClient.config,
      },
    );
  }

  async extractText(sources: Array<string | Buffer>): Promise<string> {
    const results = await scribe.extractText(sources);
    return results.join('\n');
  }

  async extractClauses(text: string, contractType: string) {
    const clauses = await this.aiService.extractClauses(text, contractType);
    return z.array(ClauseSchema).parse(clauses);
  }

  async saveContract(contractId: string, title: string, clauses: any[]) {
    const session = this.driver.session();
    try {
      await session.run('MERGE (c:Contract {id: $id, title: $title})', {
        id: contractId,
        title,
      });
      for (const clause of clauses) {
        const clauseId = `${contractId}-${Math.random().toString(36).slice(2)}`;
        await session.run(
          'MATCH (c:Contract {id: $cid}) CREATE (cl:Clause {id: $id, title: $title, clauseType: $type, text: $text, riskScore: $risk})<-[:HAS_CLAUSE]-(c)',
          {
            cid: contractId,
            id: clauseId,
            title: clause.title,
            type: clause.clauseType,
            text: clause.text,
            risk: clause.riskScore,
          },
        );
        await this.storeEmbedding(clauseId, clause.text);
      }
    } finally {
      await session.close();
    }
  }

  private async storeEmbedding(clauseId: string, text: string) {
    if (
      !(await this.milvusClient.hasCollection({
        collection_name:
          this.configService.get<string>('MILVUS_COLLECTION', {
            infer: true,
          }) || 'clauses',
      }))
    ) {
      await this.milvusClient
        .createCollection({
          collection_name:
            this.configService.get<string>('MILVUS_COLLECTION', {
              infer: true,
            }) || 'clauses',
          fields: [
            {
              name: 'id',
              data_type: DataType.Int64,
              is_primary_key: true,
              autoID: false,
            },
            {
              name: 'embedding',
              data_type: DataType.FloatVector,
              type_params: { dim: '1536' },
            },
          ],
        })
        .catch(() => {});
      await this.milvusClient.loadCollectionSync({
        collection_name:
          this.configService.get<string>('MILVUS_COLLECTION', {
            infer: true,
          }) || 'clauses',
      });
    }

    const data = [
      new Document({
        pageContent: text,
        metadata: {
          id: clauseId,
        },
      }),
    ];

    await this.vectorStore.addDocuments(data);
  }

  async searchClauses(query: string, topK = 5) {
    const results = await this.vectorStore.similaritySearch(query, topK);
    const ids = results.map((r) => r.metadata.id);
    const session = this.driver.session();
    try {
      const res = await session.run(
        'MATCH (c:Clause) WHERE c.id IN $ids RETURN c',
        { ids },
      );
      return res.records.map((rec) => rec.get('c').properties);
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    if (this.driver) {
      await this.driver.close();
    }
    if (this.milvusClient) {
      await this.milvusClient.closeConnection();
    }
  }
}
