import { describe, it, expect } from "vitest"
import {
  ProfileSchema,
  CompanySchema,
  SubscriptionOutSchema,
  CredentialMetadataOutSchema,
  PageSchema,
  ProblemDetailsSchema,
} from "./api-validation"
import type { Profile, Company } from "@/lib/types/user"

describe("API Validation Schemas", () => {
  describe("ProfileSchema", () => {
    it("validates a valid profile", () => {
      const validProfile: Profile = {
        id: "user-123",
        company_id: "company-456",
        role: "admin",
        full_name: "John Doe",
        email: "john@example.com",
        created_at: "2024-05-21T10:30:00Z",
      }
      expect(() => ProfileSchema.parse(validProfile)).not.toThrow()
    })

    it("rejects profile with invalid email", () => {
      const invalidProfile = {
        id: "user-123",
        company_id: "company-456",
        role: "admin",
        full_name: "John Doe",
        email: "not-an-email",
        created_at: "2024-05-21T10:30:00Z",
      }
      expect(() => ProfileSchema.parse(invalidProfile)).toThrow()
    })

    it("allows null values for optional fields", () => {
      const profile = {
        id: "user-123",
        company_id: null,
        role: "member",
        full_name: null,
        email: null,
        created_at: "2024-05-21T10:30:00Z",
      }
      expect(() => ProfileSchema.parse(profile)).not.toThrow()
    })

    it("rejects invalid role", () => {
      const invalidProfile = {
        id: "user-123",
        company_id: "company-456",
        role: "superuser",
        full_name: "John Doe",
        email: "john@example.com",
        created_at: "2024-05-21T10:30:00Z",
      }
      expect(() => ProfileSchema.parse(invalidProfile)).toThrow()
    })
  })

  describe("CompanySchema", () => {
    it("validates a valid company", () => {
      const validCompany: Company = {
        id: "company-123",
        name: "Acme Corp",
        created_at: "2024-05-21T10:30:00Z",
      }
      expect(() => CompanySchema.parse(validCompany)).not.toThrow()
    })

    it("requires all company fields", () => {
      const invalidCompany = {
        id: "company-123",
        name: "Acme Corp",
      }
      expect(() => CompanySchema.parse(invalidCompany)).toThrow()
    })
  })

  describe("PageSchema", () => {
    it("validates a valid page with profiles", () => {
      const validPage = {
        items: [
          {
            id: "user-1",
            company_id: null,
            role: "admin",
            full_name: "User One",
            email: "user1@example.com",
            created_at: "2024-05-21T10:30:00Z",
          },
        ],
        total: 100,
        page: 1,
        size: 10,
        pages: 10,
      }
      const schema = PageSchema(ProfileSchema)
      expect(() => schema.parse(validPage)).not.toThrow()
    })

    it("requires valid pagination fields", () => {
      const invalidPage = {
        items: [],
        total: "not-a-number",
        page: 1,
        size: 10,
        pages: 10,
      }
      const schema = PageSchema(ProfileSchema)
      expect(() => schema.parse(invalidPage)).toThrow()
    })

    it("rejects negative page numbers", () => {
      const invalidPage = {
        items: [],
        total: 0,
        page: -1,
        size: 10,
        pages: 0,
      }
      const schema = PageSchema(ProfileSchema)
      expect(() => schema.parse(invalidPage)).toThrow()
    })
  })

  describe("ProblemDetailsSchema", () => {
    it("validates a problem details response", () => {
      const problemDetails = {
        type: "https://api.example.com/errors/validation",
        title: "Validation Error",
        status: 400,
        code: "INVALID_INPUT",
        detail: "The email field is invalid",
        instance: "request-id-123",
      }
      expect(() => ProblemDetailsSchema.parse(problemDetails)).not.toThrow()
    })

    it("allows extra fields in problem details", () => {
      const problemDetails = {
        title: "Server Error",
        status: 500,
        code: "INTERNAL_ERROR",
        extra_field: "extra_value",
        nested: { data: "value" },
      }
      expect(() => ProblemDetailsSchema.parse(problemDetails)).not.toThrow()
    })
  })

  describe("SubscriptionOutSchema", () => {
    it("validates a valid subscription response", () => {
      const subscription = {
        iccid: "8934076500006539419",
        msisdn: "+573012345678",
        imsi: "310026123456789",
        status: "active" as const,
        native_status: "Active",
        provider: "kite" as const,
        company_id: "company-123",
        activated_at: "2024-05-21T10:30:00Z",
        updated_at: "2024-05-21T10:30:00Z",
        detail_level: "summary" as const,
        provider_fields: { customField: "value" },
        normalized: {
          identity: {
            iccid: "8934076500006539419",
            msisdn: "+573012345678",
            imsi: "310026123456789",
            imei: null,
            alias: null,
            eid: null,
            euiccid: null,
            sim_profile_id: null,
          },
          status: {
            value: "active" as const,
            native: "Active",
            last_changed_at: "2024-05-21T10:30:00Z",
          },
          plan: {
            name: "Premium Plan",
            code: "PREMIUM",
            id: "plan-123",
            communication_plan: null,
            apn: "internet.kite",
            apns: ["internet.kite"],
            started_at: null,
            expires_at: null,
          },
          customer: {
            name: "John Doe",
            id: "cust-123",
            company_code: null,
            account_id: null,
          },
          network: {
            operator: "Movistar",
            country: "CO",
            rat_type: "4G",
            last_network: null,
            ip_address: null,
            sgsn_ip: null,
            ggsn_ip: null,
            last_traffic_at: null,
            first_lu_at: null,
            last_lu_at: null,
            first_cdr_at: null,
            last_cdr_at: null,
            gprs: null,
            ip: null,
            location: null,
          },
          hardware: {
            sim_model: "SIM",
            module_manufacturer: null,
            module_model: null,
            device_id: null,
            modem_id: null,
            imei_last_changed_at: null,
            shipped_at: null,
          },
          services: {
            active: ["voice", "sms", "data"],
            basic: null,
            supplementary: null,
            data_service: true,
            sms_service: true,
          },
          limits: {
            data: 5000,
            data_unit: "mb" as const,
            sms: null,
            daily: {
              data: { limit: 500, value: 250, threshold_reached: false, traffic_cut: false, enabled: true },
            },
            monthly: {
              data: { limit: 5000, value: 2500, threshold_reached: false, traffic_cut: false, enabled: true },
            },
          },
          dates: {
            activated_at: "2024-05-21T10:30:00Z",
            updated_at: "2024-05-21T10:30:00Z",
            added_at: null,
            provisioned_at: null,
          },
          custom_fields: {},
        },
      }

      expect(() => SubscriptionOutSchema.parse(subscription)).not.toThrow()
    })
  })

  describe("CredentialMetadataOutSchema", () => {
    it("validates a valid credential metadata response", () => {
      const credential = {
        provider: "kite" as const,
        active: true,
        expiry_status: "valid" as const,
        created_at: "2024-05-21T10:30:00Z",
        rotated_at: null,
        account_scope: { environment: "production", account_id: "123456" },
      }
      expect(() => CredentialMetadataOutSchema.parse(credential)).not.toThrow()
    })

    it("rejects invalid provider", () => {
      const credential = {
        provider: "invalid" as any,
        active: true,
        expiry_status: "valid" as const,
        created_at: "2024-05-21T10:30:00Z",
        rotated_at: null,
        account_scope: {},
      }
      expect(() => CredentialMetadataOutSchema.parse(credential)).toThrow()
    })
  })
})
