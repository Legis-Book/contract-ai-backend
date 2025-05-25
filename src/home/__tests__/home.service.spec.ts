import { HomeService } from '../home.service';
import { ConfigService } from '@nestjs/config';

describe('HomeService', () => {
  it('should return app name', () => {
    const configService = {
      get: jest.fn(() => 'test'),
    } as unknown as ConfigService;
    const service = new HomeService(configService);
    const result = service.appInfo();
    expect(configService.get).toHaveBeenCalledWith('app.name', { infer: true });
    expect(result).toEqual({ name: 'test' });
  });
});
