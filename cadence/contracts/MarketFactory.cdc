// cadence/contracts/MarketFactory.cdc
// Factory contract for creating and managing prediction markets - Fixed for Cadence 1.0

import FlowWager from "FlowWager"

access(all) contract MarketFactory {
    
    // ========================================
    // EVENTS
    // ========================================
    
    access(all) event MarketTemplateCreated(templateId: UInt64, name: String, category: UInt8)
    access(all) event MarketCreatedFromTemplate(marketId: UInt64, templateId: UInt64, creator: Address)
    access(all) event MarketFactoryInitialized()
    
    // ========================================
    // STRUCTS
    // ========================================
    
    access(all) struct MarketTemplate {
        access(all) let id: UInt64
        access(all) let name: String
        access(all) let description: String
        access(all) let questionTemplate: String // e.g., "Will {EVENT} happen by {DATE}?"
        access(all) let optionATemplate: String // e.g., "Yes"
        access(all) let optionBTemplate: String // e.g., "No"
        access(all) let category: FlowWager.MarketCategory
        access(all) let defaultDuration: UFix64
        access(all) let defaultMinBet: UFix64
        access(all) let defaultMaxBet: UFix64
        access(all) let isBreakingNewsTemplate: Bool
        access(all) let createdAt: UFix64
        access(all) let creator: Address
        access(all) var active: Bool
        access(all) var usageCount: UInt64
        
        init(
            id: UInt64,
            name: String,
            description: String,
            questionTemplate: String,
            optionATemplate: String,
            optionBTemplate: String,
            category: FlowWager.MarketCategory,
            defaultDuration: UFix64,
            defaultMinBet: UFix64,
            defaultMaxBet: UFix64,
            isBreakingNewsTemplate: Bool,
            creator: Address
        ) {
            self.id = id
            self.name = name
            self.description = description
            self.questionTemplate = questionTemplate
            self.optionATemplate = optionATemplate
            self.optionBTemplate = optionBTemplate
            self.category = category
            self.defaultDuration = defaultDuration
            self.defaultMinBet = defaultMinBet
            self.defaultMaxBet = defaultMaxBet
            self.isBreakingNewsTemplate = isBreakingNewsTemplate
            self.createdAt = getCurrentBlock().timestamp
            self.creator = creator
            self.active = true
            self.usageCount = 0
        }
        
        access(contract) fun incrementUsage() {
            self.usageCount = self.usageCount + 1
        }
        
        access(contract) fun setActive(active: Bool) {
            self.active = active
        }
    }
    
    access(all) struct MarketValidationResult {
        access(all) let isValid: Bool
        access(all) let errors: [String]
        access(all) let warnings: [String]
        
        init(isValid: Bool, errors: [String], warnings: [String]) {
            self.isValid = isValid
            self.errors = errors
            self.warnings = warnings
        }
    }
    
    access(all) struct MarketCreationRequest {
        access(all) let question: String
        access(all) let optionA: String
        access(all) let optionB: String
        access(all) let category: FlowWager.MarketCategory
        access(all) let imageURI: String
        access(all) let duration: UFix64
        access(all) let isBreakingNews: Bool
        access(all) let minBet: UFix64
        access(all) let maxBet: UFix64
        access(all) let templateId: UInt64?
        access(all) let customMetadata: {String: String}
        
        init(
            question: String,
            optionA: String,
            optionB: String,
            category: FlowWager.MarketCategory,
            imageURI: String,
            duration: UFix64,
            isBreakingNews: Bool,
            minBet: UFix64,
            maxBet: UFix64,
            templateId: UInt64?,
            customMetadata: {String: String}
        ) {
            self.question = question
            self.optionA = optionA
            self.optionB = optionB
            self.category = category
            self.imageURI = imageURI
            self.duration = duration
            self.isBreakingNews = isBreakingNews
            self.minBet = minBet
            self.maxBet = maxBet
            self.templateId = templateId
            self.customMetadata = customMetadata
        }
    }
    
    // ========================================
    // RESOURCES
    // ========================================
    
    access(all) resource FactoryAdmin {
        access(all) fun createMarketTemplate(
            name: String,
            description: String,
            questionTemplate: String,
            optionATemplate: String,
            optionBTemplate: String,
            category: FlowWager.MarketCategory,
            defaultDuration: UFix64,
            defaultMinBet: UFix64,
            defaultMaxBet: UFix64,
            isBreakingNewsTemplate: Bool
        ): UInt64 {
            pre {
                name.length > 0: "Template name cannot be empty"
                questionTemplate.length > 0: "Question template cannot be empty"
                optionATemplate.length > 0: "Option A template cannot be empty"
                optionBTemplate.length > 0: "Option B template cannot be empty"
                defaultDuration > 0.0: "Default duration must be positive"
                defaultMinBet > 0.0: "Default minimum bet must be positive"
                defaultMaxBet >= defaultMinBet: "Default maximum bet must be >= minimum bet"
            }
            
            let templateId = MarketFactory.nextTemplateId
            let template = MarketTemplate(
                id: templateId,
                name: name,
                description: description,
                questionTemplate: questionTemplate,
                optionATemplate: optionATemplate,
                optionBTemplate: optionBTemplate,
                category: category,
                defaultDuration: defaultDuration,
                defaultMinBet: defaultMinBet,
                defaultMaxBet: defaultMaxBet,
                isBreakingNewsTemplate: isBreakingNewsTemplate,
                creator: self.owner!.address
            )
            
            MarketFactory.templates[templateId] = template
            MarketFactory.nextTemplateId = MarketFactory.nextTemplateId + 1
            MarketFactory.totalTemplates = MarketFactory.totalTemplates + 1
            
            emit MarketTemplateCreated(
                templateId: templateId,
                name: name,
                category: category.rawValue
            )
            
            return templateId
        }
        
        access(all) fun updateMarketTemplate(
            templateId: UInt64,
            name: String?,
            description: String?,
            active: Bool?
        ) {
            pre {
                MarketFactory.templates.containsKey(templateId): "Template does not exist"
            }
            
            // Fixed: Properly handle optional dictionary access
            if let templateRef = &MarketFactory.templates[templateId] as &MarketTemplate? {
                if active != nil {
                    templateRef.setActive(active: active!)
                }
            }
        }
        
        access(all) fun createMarketFromTemplate(
            templateId: UInt64,
            question: String,
            optionA: String?,
            optionB: String?,
            imageURI: String,
            duration: UFix64?,
            minBet: UFix64?,
            maxBet: UFix64?,
            customMetadata: {String: String}
        ): UInt64 {
            pre {
                MarketFactory.templates.containsKey(templateId): "Template does not exist"
            }
            
            // Fixed: Properly handle optional dictionary access
            if let templateRef = &MarketFactory.templates[templateId] as &MarketTemplate? {
                assert(templateRef.active, message: "Template is not active")
                
                // Use template defaults if not provided
                let finalOptionA = optionA ?? templateRef.optionATemplate
                let finalOptionB = optionB ?? templateRef.optionBTemplate
                let finalDuration = duration ?? templateRef.defaultDuration
                let finalMinBet = minBet ?? templateRef.defaultMinBet
                let finalMaxBet = maxBet ?? templateRef.defaultMaxBet
                
                // This would integrate with FlowWager's market creation
                let marketId: UInt64 = MarketFactory.totalMarketsFromTemplates + 1
                MarketFactory.totalMarketsFromTemplates = MarketFactory.totalMarketsFromTemplates + 1
                
                // Update template usage
                templateRef.incrementUsage()
                
                emit MarketCreatedFromTemplate(
                    marketId: marketId,
                    templateId: templateId,
                    creator: self.owner!.address
                )
                
                return marketId
            }
            panic("Template not found")
        }
    }
    
    access(all) resource MarketValidator {
        access(all) fun validateMarket(request: MarketCreationRequest): MarketValidationResult {
            var errors: [String] = []
            var warnings: [String] = []
            
            // Validate question
            if request.question.length == 0 {
                errors.append("Question cannot be empty")
            } else if request.question.length > 500 {
                errors.append("Question too long (max 500 characters)")
            }
            
            // Validate options
            if request.optionA.length == 0 {
                errors.append("Option A cannot be empty")
            } else if request.optionA.length > 100 {
                errors.append("Option A too long (max 100 characters)")
            }
            
            if request.optionB.length == 0 {
                errors.append("Option B cannot be empty")
            } else if request.optionB.length > 100 {
                errors.append("Option B too long (max 100 characters)")
            }
            
            if request.optionA == request.optionB {
                errors.append("Options must be different")
            }
            
            // Validate duration
            if request.duration <= 0.0 {
                errors.append("Duration must be positive")
            } else if request.duration < 3600.0 {
                errors.append("Minimum duration is 1 hour")
            } else if request.duration > 2592000.0 {
                errors.append("Maximum duration is 30 days")
            }
            
            // Breaking news duration check
            if request.isBreakingNews && request.duration > 86400.0 {
                warnings.append("Breaking news markets typically last less than 24 hours")
            }
            
            // Validate betting limits
            if request.minBet <= 0.0 {
                errors.append("Minimum bet must be positive")
            } else if request.minBet < 0.1 {
                warnings.append("Very low minimum bet may attract spam")
            }
            
            if request.maxBet < request.minBet {
                errors.append("Maximum bet must be >= minimum bet")
            } else if request.maxBet > 10000.0 {
                warnings.append("Very high maximum bet may limit participation")
            }
            
            // Validate image URI
            if request.imageURI.length == 0 {
                errors.append("Image URI cannot be empty")
            }
            
            return MarketValidationResult(
                isValid: errors.length == 0,
                errors: errors,
                warnings: warnings
            )
        }
        
        access(all) fun getMarketRecommendations(category: FlowWager.MarketCategory): [String] {
            var recommendations: [String] = []
            
            // Fixed: Use raw values for enum comparison
            switch category.rawValue {
                case FlowWager.MarketCategory.Crypto.rawValue:
                    recommendations.append("Consider price prediction markets")
                    recommendations.append("Include specific cryptocurrency names")
                    recommendations.append("Set reasonable price targets")
                case FlowWager.MarketCategory.Sports.rawValue:
                    recommendations.append("Include team names and event details")
                    recommendations.append("Set end time after event completion")
                    recommendations.append("Consider weather conditions for outdoor sports")
                case FlowWager.MarketCategory.BreakingNews.rawValue:
                    recommendations.append("Keep duration short (1-24 hours)")
                    recommendations.append("Ensure rapid resolution capability")
                    recommendations.append("Include news source verification")
                default:
                    recommendations.append("Provide clear, objective criteria")
                    recommendations.append("Include relevant context and dates")
            }
            
            return recommendations
        }
    }
    
    // ========================================
    // CONTRACT STATE
    // ========================================
    
    access(contract) var templates: {UInt64: MarketTemplate}
    access(contract) var nextTemplateId: UInt64
    access(all) var totalTemplates: UInt64
    access(all) var totalMarketsFromTemplates: UInt64
    
    // Storage Paths
    access(all) let FactoryAdminStoragePath: StoragePath
    access(all) let MarketValidatorStoragePath: StoragePath
    access(all) let MarketValidatorPublicPath: PublicPath
    
    // ========================================
    // PUBLIC FUNCTIONS
    // ========================================
    
    access(all) fun getTemplate(templateId: UInt64): MarketTemplate? {
        return self.templates[templateId]
    }
    
    access(all) fun getAllTemplates(): [MarketTemplate] {
        return self.templates.values
    }
    
    access(all) fun getTemplatesByCategory(category: FlowWager.MarketCategory): [MarketTemplate] {
        let categoryTemplates: [MarketTemplate] = []
        
        for template in self.templates.values {
            if template.category.rawValue == category.rawValue && template.active {
                categoryTemplates.append(template)
            }
        }
        
        return categoryTemplates
    }
    
    access(all) fun getPopularTemplates(limit: UInt64): [MarketTemplate] {
        let allTemplates = self.templates.values
        return allTemplates
    }
    
    access(all) fun getFactoryStats(): {String: AnyStruct} {
        var activeTemplates: UInt64 = 0
        var totalUsage: UInt64 = 0
        
        for template in self.templates.values {
            if template.active {
                activeTemplates = activeTemplates + 1
            }
            totalUsage = totalUsage + template.usageCount
        }
        
        return {
            "totalTemplates": self.totalTemplates,
            "activeTemplates": activeTemplates,
            "totalMarketsFromTemplates": self.totalMarketsFromTemplates,
            "totalUsage": totalUsage,
            "averageUsagePerTemplate": activeTemplates > 0 ? totalUsage / activeTemplates : 0
        }
    }
    
    access(all) fun validateMarketRequest(request: MarketCreationRequest): MarketValidationResult {
        let validatorRef = self.account.capabilities.borrow<&MarketValidator>(self.MarketValidatorPublicPath)
            ?? panic("Could not borrow MarketValidator reference")
        
        return validatorRef.validateMarket(request: request)
    }
    
    access(all) fun getMarketRecommendations(category: FlowWager.MarketCategory): [String] {
        let validatorRef = self.account.capabilities.borrow<&MarketValidator>(self.MarketValidatorPublicPath)
            ?? panic("Could not borrow MarketValidator reference")
        
        return validatorRef.getMarketRecommendations(category: category)
    }
    
    access(all) fun getSuggestedDuration(category: FlowWager.MarketCategory, isBreakingNews: Bool): UFix64 {
        if isBreakingNews {
            return 3600.0 // 1 hour for breaking news
        }
        
        // Fixed: Use raw values for enum comparison
        switch category.rawValue {
            case FlowWager.MarketCategory.Sports.rawValue:
                return 86400.0 * 3.0 // 3 days for sports events
            case FlowWager.MarketCategory.Crypto.rawValue:
                return 86400.0 * 7.0 // 1 week for crypto predictions
            case FlowWager.MarketCategory.Politics.rawValue:
                return 86400.0 * 30.0 // 30 days for political events
            case FlowWager.MarketCategory.Economics.rawValue:
                return 86400.0 * 14.0 // 2 weeks for economic predictions
            default:
                return 86400.0 * 7.0 // 1 week default
        }
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    init() {
        self.templates = {}
        self.nextTemplateId = 1
        self.totalTemplates = 0
        self.totalMarketsFromTemplates = 0
        
        self.FactoryAdminStoragePath = /storage/MarketFactoryAdmin
        self.MarketValidatorStoragePath = /storage/MarketValidator
        self.MarketValidatorPublicPath = /public/MarketValidator
        
        // Create and store Factory Admin resource
        let factoryAdmin <- create FactoryAdmin()
        self.account.storage.save(<-factoryAdmin, to: self.FactoryAdminStoragePath)
        
        // Create and store Market Validator resource
        let validator <- create MarketValidator()
        self.account.storage.save(<-validator, to: self.MarketValidatorStoragePath)
        
        // Link public capability for validator (Cadence 1.0 syntax)
        let validatorCap = self.account.capabilities.storage.issue<&MarketValidator>(self.MarketValidatorStoragePath)
        self.account.capabilities.publish(validatorCap, at: self.MarketValidatorPublicPath)
        
        emit MarketFactoryInitialized()
    }
}