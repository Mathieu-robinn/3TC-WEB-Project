import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service.js";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma.service.js";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue("mock-token"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should hash password and create a new user if email is unique", async () => {
      const dto = { email: "test@example.com", password: "pwd", firstName: "A", lastName: "B" };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockImplementation(async (args) => {
        return { id: 1, ...args.data, role: "BENEVOLE" };
      });

      const result = await service.register(dto.email, dto.password, dto.firstName, dto.lastName);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prisma.user.create).toHaveBeenCalled();
      
      const createArgs = (prisma.user.create as jest.Mock).mock.calls[0][0];
      const isHashValid = await bcrypt.compare(dto.password, createArgs.data.password);
      expect(isHashValid).toBe(true);

      expect(result).toEqual({
        accessToken: "mock-token",
        user: { id: 1, email: dto.email, role: "BENEVOLE" },
      });
    });

    it("should throw UnauthorizedException if email already exists", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.register("test@example.com", "pwd", "A", "B")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("login", () => {
    it("should return a token for valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("pwd", 10);
      const user = { id: 1, email: "test@example.com", password: hashedPassword, role: "BENEVOLE" };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const result = await service.login("test@example.com", "pwd");

      expect(result.accessToken).toBe("mock-token");
      expect(result.user.email).toBe(user.email);
    });

    it("should throw UnauthorizedException for invalid email", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login("wrong@example.com", "pwd")).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException for invalid password", async () => {
      const hashedPassword = await bcrypt.hash("pwd", 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ password: hashedPassword });

      await expect(service.login("test@example.com", "wrong")).rejects.toThrow(UnauthorizedException);
    });
  });
});
