export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'contract_ai',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-pro',
    },
  },
  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,txt').split(
      ',',
    ),
  },
  langfuse: {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    baseUrl: process.env.LANGFUSE_BASE_URL || '',
  },
  milvus: {
    address: process.env.MILVUS_ADDRESS || '',
    collection: process.env.MILVUS_COLLECTION || '',
  },
  neo4j: {
    uri: process.env.NEO4J_URI || '',
    user: process.env.NEO4J_USER || '',
    password: process.env.NEO4J_PASSWORD || '',
  },
  voyage: {
    apiKey: process.env.VOYAGE_API_KEY || '',
    model: process.env.VOYAGE_MODEL || '',
    inputType: process.env.VOYAGE_INPUT_TYPE || 'document',
    truncation: process.env.VOYAGE_TRUNCATION || false,
    outputDimension: parseInt(
      process.env.VOYAGE_OUTPUT_DIMENSION || '1536',
      10,
    ),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  file: {
    awsS3Region: process.env.AWS_S3_REGION || '',
    accessKeyId: process.env.ACCESS_KEY_ID || '',
    secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
    awsDefaultS3Bucket: process.env.AWS_DEFAULT_S3_BUCKET || '',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10000000', 10),
  },
});

// Gemini and OpenAI configs are now available via @nestjs/config injection using their respective keys ('gemini', 'openai').
