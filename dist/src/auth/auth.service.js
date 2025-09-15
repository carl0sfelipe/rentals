"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = exports.PBKDF2Hasher = exports.LoginDto = exports.RegisterDto = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const feature_flags_1 = require("../config/feature-flags");
const crypto = __importStar(require("crypto"));
class RegisterDto {
}
exports.RegisterDto = RegisterDto;
class LoginDto {
}
exports.LoginDto = LoginDto;
let PBKDF2Hasher = class PBKDF2Hasher {
    async hash(plain) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(plain, salt, 1000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }
    async compare(plain, stored) {
        if (!stored.includes(':'))
            return stored === `hashed:${plain}`;
        const [salt, hash] = stored.split(':');
        const verify = crypto.pbkdf2Sync(plain, salt, 1000, 64, 'sha512').toString('hex');
        return hash === verify;
    }
};
exports.PBKDF2Hasher = PBKDF2Hasher;
exports.PBKDF2Hasher = PBKDF2Hasher = __decorate([
    (0, common_1.Injectable)()
], PBKDF2Hasher);
let AuthService = class AuthService {
    constructor(prisma, jwt, hasher) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.hasher = hasher;
    }
    async register(dto) {
        try {
            const hashed = await this.hasher.hash(dto.password);
            const user = await this.prisma.user.create({
                data: { email: dto.email, password: hashed, name: dto.name }
            });
            const result = {
                access_token: await this.jwt.signAsync({
                    sub: user.id,
                    email: user.email
                }),
                id: user.id,
                email: user.email,
                name: user.name
            };
            return result;
        }
        catch (err) {
            if (err?.code === 'P2002')
                throw new common_1.ConflictException('Email already in use');
            throw err;
        }
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email }
        });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await this.hasher.compare(dto.password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if ((0, feature_flags_1.isMultiTenantEnabled)()) {
            const userOrg = await this.prisma.organizationUser.findFirst({
                where: { userId: user.id },
                include: { organization: true }
            });
            const activeOrganizationId = userOrg?.organizationId || null;
            return {
                access_token: await this.jwt.signAsync({
                    sub: user.id,
                    email: user.email,
                    activeOrganizationId
                })
            };
        }
        else {
            return {
                access_token: await this.jwt.signAsync({
                    sub: user.id,
                    email: user.email
                })
            };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('PasswordHasher')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map