import { Test } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Mock NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Main Bootstrap', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      listen: jest.fn(),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should bootstrap the application', async () => {
    // Import and execute the bootstrap function
    const { bootstrap } = await import('./main');
    
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(mockApp.listen).toHaveBeenCalledWith(3000);
  });

  it('should handle bootstrap errors', async () => {
    const error = new Error('Bootstrap failed');
    (NestFactory.create as jest.Mock).mockRejectedValue(error);

    // Mock console.error to avoid error output during tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { bootstrap } = await import('./main');
    
    await expect(bootstrap()).rejects.toThrow('Bootstrap failed');

    consoleSpy.mockRestore();
  });
});