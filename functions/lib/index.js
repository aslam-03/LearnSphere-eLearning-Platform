"use strict";
/**
 * ============================================
 * LEARNSPHERE CLOUD FUNCTIONS
 * ============================================
 *
 * PURPOSE:
 * Backend logic for gamification, analytics, and privileged operations.
 * All functions use Firebase Admin SDK for server-side operations.
 *
 * CRITICAL RULES:
 * 1. Never expose admin logic to client
 * 2. All point calculations happen server-side
 * 3. Badge progression is automatic and tamper-proof
 * 4. Analytics are computed in real-time or scheduled
 * 5. Security rules enforce all data access
 *
 * EXPORTS:
 * - Gamification triggers (quiz scoring, badge upgrades)
 * - Analytics aggregation
 * - Scheduled cleanup jobs
 * - HTTP callable functions for privileged operations
 */
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
admin.initializeApp();
// Export all function modules
__exportStar(require("./gamification"), exports);
__exportStar(require("./analytics"), exports);
__exportStar(require("./maintenance"), exports);
__exportStar(require("./api"), exports);
//# sourceMappingURL=index.js.map