# Template System Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEMPLATE GENERATION SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  Business Training  │
                    │   Questionnaire     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Training Complete  │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
   ┌────────────────────────┐    ┌────────────────────────┐
   │  BUSINESS-SPECIFIC     │    │  GENERIC TEMPLATES     │
   │  TEMPLATES             │    │  (Industry-Wide)       │
   └────────────────────────┘    └────────────────────────┘
   │                             │
   │ • Personalized copy         │ • Generic industry copy
   │ • Business name included    │ • No business names
   │ • Custom timing/audience    │ • General timing
   │ • Unique promo codes        │ • "GEN" suffix codes
   │ • businessId: <ObjectId>    │ • businessId: null
   │ • scope: "business_specific"│ • scope: "generic"
   │                             │
   └──────────────┬──────────────┴──────────────┘
                  │
                  ▼
       ┌──────────────────────┐
       │  Templates Database  │
       │  (MongoDB)           │
       └──────────────────────┘
```

## Template Generation Flow

### Business-Specific Templates

```
┌──────────────┐
│   Business   │
│  Completes   │──────┐
│   Training   │      │
└──────────────┘      │
                      ▼
              ┌───────────────────┐
              │ Extract Training  │
              │      Data:        │
              │ • Target audience │
              │ • Slow periods    │
              │ • Discount ranges │
              │ • Brand voice     │
              │ • Marketing goals │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  AI Generation    │
              │   with Business   │
              │   Specifics       │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │ Create Template:  │
              │ • Title with name │
              │ • Personalized    │
              │   description     │
              │ • Custom timing   │
              │ • Unique promo    │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Save with:       │
              │  scope="business_ │
              │  specific"        │
              │  businessId=<id>  │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Template stored  │
              │  for ONLY this    │
              │  business         │
              └───────────────────┘
```

### Generic Templates

```
┌──────────────┐
│  Industry    │
│  Identified  │──────┐
│              │      │
└──────────────┘      │
                      ▼
              ┌───────────────────┐
              │ Find Sample       │
              │ Trained Business  │
              │ in Industry       │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Generate from    │
              │  Sample Business  │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Remove Business  │
              │  Specifics:       │
              │ • Strip names     │
              │ • Generalize copy │
              │ • Add GEN suffix  │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Save with:       │
              │  scope="generic"  │
              │  businessId=null  │
              │  businessIndustry │
              │  =<industry_id>   │
              └────────┬──────────┘
                       │
                       ▼
              ┌───────────────────┐
              │  Template         │
              │  available to ALL │
              │  businesses in    │
              │  industry         │
              └───────────────────┘
```

## Query Patterns

### For a Business

```
┌────────────────────┐
│  Business Request  │
│  Templates         │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────────┐
│ GET /api/templates?             │
│   businessId=123&               │
│   industryId=456                │
└──────────┬──────────────────────┘
           │
           ├─────────────┬──────────────┐
           │             │              │
           ▼             ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Generic  │  │Business- │  │  Merge   │
    │Templates │  │Specific  │  │  Results │
    │for       │  │Templates │  │          │
    │Industry  │  │for       │  │          │
    │          │  │Business  │  │          │
    └─────┬────┘  └────┬─────┘  └────┬─────┘
          │            │              │
          └────────────┴──────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │ Return Combined: │
            │ • 4 generic      │
            │ • 4 business-    │
            │   specific       │
            │ = 8 templates    │
            └──────────────────┘
```

### Generic Only

```
┌────────────────────┐
│  Query Generic     │
│  Templates         │
└─────────┬──────────┘
          │
          ▼
┌─────────────────────────────────┐
│ GET /api/templates?             │
│   scope=generic&                │
│   industryId=456                │
└──────────┬──────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Filter:      │
    │ scope=       │
    │ "generic"    │
    │ AND          │
    │ industry=456 │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Return only  │
    │ generic      │
    │ templates    │
    └──────────────┘
```

## Overnight Update Job (2:00 AM Daily)

```
┌──────────────────────┐
│   Cron Trigger       │
│   Every day 2:00 AM  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Template Update Job  │
└──────────┬───────────┘
           │
           ├─────────────────────────┬──────────────────────┐
           │                         │                      │
           ▼                         ▼                      ▼
┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐
│ Find Templates     │   │ Find All Trained   │   │ Find All     │
│ Needing Update     │   │ Businesses         │   │ Industries   │
│ (nextUpdate <= now)│   │                    │   │              │
└─────────┬──────────┘   └─────────┬──────────┘   └──────┬───────┘
          │                        │                      │
          │                        │                      │
          ▼                        ▼                      ▼
┌────────────────────┐   ┌────────────────────┐   ┌──────────────┐
│ For each template: │   │ For each business: │   │ For each     │
│ • Get businessId   │   │ Generate 4         │   │ industry:    │
│ • Regenerate       │   │ business-specific  │   │ Generate 4   │
│ • Update DB        │   │ templates:         │   │ generic      │
│ • Set next update  │   │ - General          │   │ templates    │
│   = now + 24h      │   │ - Seasonal         │   │              │
│                    │   │ - Slow period      │   │              │
│                    │   │ - Trending         │   │              │
└────────────────────┘   └────────────────────┘   └──────────────┘
           │                        │                      │
           └────────────────────────┴──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Log Results:        │
                        │  • Success count     │
                        │  • Failure count     │
                        │  • Duration          │
                        └──────────────────────┘
```

## User Journey

### New Business (No Training)

```
┌──────────────┐
│ New Business │
│  Signs Up    │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Browse Templates    │
│ (Generic Only)      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Select Generic      │
│ Template            │
│ "15% Off!"          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Launch Campaign     │
│ Immediately         │
└─────────────────────┘
```

### Trained Business

```
┌──────────────┐
│   Business   │
│  Completes   │
│  Training    │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ System Generates:   │
│ • 4 business-       │
│   specific          │
│ • Also has access   │
│   to 4 generic      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Browse Templates    │
│ (8 options)         │
└──────┬──────────────┘
       │
       ├──────────────┬───────────────┐
       │              │               │
       ▼              ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Choose   │   │ Choose   │   │  Mix &   │
│Business- │   │ Generic  │   │  Match   │
│Specific  │   │(fallback)│   │          │
└──────────┘   └──────────┘   └──────────┘
```

## API Call Flow

```
┌──────────────────────────────────────────────────────┐
│                  API Request Flow                    │
└──────────────────────────────────────────────────────┘

GET /api/templates?businessId=123&industryId=456

           │
           ▼
    ┌──────────────┐
    │ Controller   │
    │ getTemplates │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────┐
    │ Parse Query Params:  │
    │ • businessId = 123   │
    │ • industryId = 456   │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Call Model Helper:   │
    │ findTemplatesFor     │
    │ Business(123, 456)   │
    └──────┬───────────────┘
           │
           ▼
    ┌────────────────────────────┐
    │ Database Query:            │
    │ {                          │
    │   isActive: true,          │
    │   $or: [                   │
    │     {                      │
    │       scope: "business_    │
    │       specific",           │
    │       businessId: 123      │
    │     },                     │
    │     {                      │
    │       scope: "generic",    │
    │       businessIndustry:456 │
    │     }                      │
    │   ]                        │
    │ }                          │
    └──────┬─────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Return JSON: │
    │ {            │
    │   success: T │
    │   data: [... │
    │   count: 8   │
    │ }            │
    └──────────────┘
```

---

## Summary

This dual-template system provides:

1. **Quick Start**: New businesses use generic templates immediately
2. **Personalization**: Trained businesses get custom templates
3. **Flexibility**: Businesses can choose generic or personalized
4. **Scalability**: Generic templates reduce per-business generation
5. **Auto-Updates**: Both types refresh overnight automatically

The system balances **ease of use** (generic) with **personalization** (business-specific)! 🚀
