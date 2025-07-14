const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fit Harmony API',
      version: '1.0.0',
      description: 'Fit Harmony 피트니스 플랫폼 API 문서',
      contact: {
        name: 'Fit Harmony Team',
        email: 'support@fitharmony.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: '개발 서버'
      },
      {
        url: 'https://api.fitharmony.com',
        description: '프로덕션 서버'
      }
    ],
    tags: [
      {
        name: '인증',
        description: '사용자 인증 관련 API'
      },
      {
        name: '커뮤니티',
        description: '커뮤니티 게시판 관련 API'
      },
      {
        name: '스케줄',
        description: '운동 스케줄 관리 API'
      },
      {
        name: '인바디',
        description: '인바디 측정 데이터 관리 API'
      },
      {
        name: '트레이너',
        description: '트레이너 관련 API'
      },
      {
        name: '구매',
        description: '상품 구매 관련 API'
      },
      {
        name: '마이페이지',
        description: '사용자 프로필 및 설정 API'
      },
      {
        name: 'INTRO',
        description: '메인 페이지 소개 API'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: '세션 쿠키를 통한 인증'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '에러 메시지'
            },
            success: {
              type: 'boolean',
              example: false
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: '성공 메시지'
            },
            success: {
              type: 'boolean',
              example: true
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: '인증이 필요합니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: '권한이 없습니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: '리소스를 찾을 수 없습니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: '잘못된 요청입니다',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: [
    './controllers/**/*.js',
    './routes/**/*.js',
    './index.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 