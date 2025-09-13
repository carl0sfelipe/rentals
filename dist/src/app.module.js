"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const schedule_1 = require("@nestjs/schedule");
const calendar_module_1 = require("./calendar/calendar.module");
const auth_module_1 = require("./auth/auth.module");
const health_module_1 = require("./health/health.module");
const properties_module_1 = require("./properties/properties.module");
const bookings_module_1 = require("./bookings/bookings.module");
const prisma_module_1 = require("./prisma/prisma.module");
const organizations_module_1 = require("./organizations/organizations.module");
const config_controller_1 = require("./config/config.controller");
const unsplash_controller_1 = require("./unsplash/unsplash.controller");
const unsplash_service_1 = require("./unsplash/unsplash.service");
const organization_context_middleware_1 = require("./organizations/organization-context.middleware");
const feature_flags_1 = require("./config/feature-flags");
let AppModule = class AppModule {
    configure(consumer) {
        if ((0, feature_flags_1.isOrganizationContextEnabled)()) {
            consumer
                .apply(organization_context_middleware_1.OrganizationContextMiddleware)
                .forRoutes('*');
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            ...((0, feature_flags_1.isMultiTenantEnabled)() ? [organizations_module_1.OrganizationsModule] : []),
            calendar_module_1.CalendarModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            properties_module_1.PropertiesModule,
            bookings_module_1.BookingsModule
        ],
        controllers: [app_controller_1.AppController, config_controller_1.ConfigController, unsplash_controller_1.UnsplashController],
        providers: [app_service_1.AppService, unsplash_service_1.UnsplashService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map