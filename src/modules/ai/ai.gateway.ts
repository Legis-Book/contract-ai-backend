import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { ContractService } from '../contract/contract.service';

@WebSocketGateway({ namespace: '/contract-chat', cors: true })
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly aiService: AiService,
    private readonly contractService: ContractService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Client requests to start a chat session for a contract
  @SubscribeMessage('startSession')
  async handleStartSession(
    @MessageBody() data: { contractId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { contractId } = data;
      await this.aiService.startChatSession(contractId);
      client.emit('sessionStarted', { contractId });
    } catch (error) {
      this.logger.error('Error starting session', error);
      client.emit('error', { message: 'Failed to start session' });
    }
  }

  // Client sends a user message for a contract chat session
  @SubscribeMessage('userMessage')
  async handleUserMessage(
    @MessageBody() data: { contractId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { contractId, message } = data;
    try {
      // Stream agent responses as they are generated
      for await (const update of this.aiService.streamChatWithContract(
        contractId,
        message,
      )) {
        // Each update may contain partial or full agent response
        client.emit('agentResponse', update);
      }
    } catch (error) {
      this.logger.error('Error in chatWithContract', error);
      client.emit('error', { message: 'Failed to process message' });
    }
  }

  // Q&A over WebSocket for contracts
  @SubscribeMessage('askQuestion')
  async handleAskQuestion(
    @MessageBody() data: { contractId: string; question: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { contractId, question } = data;
    try {
      const contract = await this.contractService.findOne(contractId);
      if (!contract.originalText) {
        client.emit('error', { message: 'Contract text is required for Q&A' });
        return;
      }
      const answer = await this.aiService.answerQuestion(
        question,
        contract.originalText,
      );
      client.emit('qnaAnswer', {
        answer: answer.answer,
        confidence: answer.confidence,
      });
    } catch (error) {
      this.logger.error('Error in askQuestion', error);
      client.emit('error', { message: 'Failed to answer question' });
    }
  }
}
