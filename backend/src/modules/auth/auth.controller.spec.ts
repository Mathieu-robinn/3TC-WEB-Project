import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { LoginRateLimitService } from "./login-rate-limit.service.js";
import type { Request } from "express";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockLoginRateLimit = {
    assertAllowed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoginRateLimitService, useValue: mockLoginRateLimit },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    it("should call authService.register and return the result", async () => {
      const dto = { email: "test@example.com", password: "pwd", firstName: "A", lastName: "B" };
      const expectedResult = { accessToken: "token", user: { id: 1, ...dto, role: "BENEVOLE" } };
      (authService.register as jest.Mock).mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(
        dto.email,
        dto.password,
        dto.firstName,
        dto.lastName,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe("login", () => {
    it("should call authService.login and return the result", async () => {
      const dto = { email: "test@example.com", password: "pwd" };
      const expectedResult = { accessToken: "token", user: { id: 1, email: dto.email, role: "BENEVOLE" } };
      (authService.login as jest.Mock).mockResolvedValue(expectedResult);

      const req = { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" } } as Request;

      const result = await controller.login(req, dto);

      expect(mockLoginRateLimit.assertAllowed).toHaveBeenCalledWith("127.0.0.1");
      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expectedResult);
    });
  });
});
