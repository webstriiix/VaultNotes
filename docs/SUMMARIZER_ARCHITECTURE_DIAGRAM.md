# Architecture Diagram - Summarizer Performance System

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Summary    │    │   Metrics    │    │  Benchmark   │      │
│  │  Component   │    │   Display    │    │    Panel     │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
└─────────┼───────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          │ HTTP/Candid       │                   │
          │                   │                   │
┌─────────▼───────────────────▼───────────────────▼───────────────┐
│                    IC Canister Backend                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AI Endpoints (ai_endpoints.rs)               │   │
│  │                                                            │   │
│  │  • ai_summarize()                                         │   │
│  │  • run_benchmark_endpoint()                               │   │
│  │  • quick_performance_test_endpoint()                      │   │
│  │  • get_cache_stats_endpoint()                             │   │
│  │  • clear_cache_endpoint()                                 │   │
│  └────┬─────────────┬──────────────┬──────────────┬──────────┘   │
│       │             │              │              │              │
│  ┌────▼─────┐  ┌───▼─────┐  ┌─────▼────┐  ┌──────▼──────┐      │
│  │   Core   │  │ Metrics │  │  Cache   │  │  Benchmark  │      │
│  │ (core.rs)│  │(metrics)│  │ (cache)  │  │ (benchmark) │      │
│  │          │  │  .rs)   │  │   .rs)   │  │    .rs)     │      │
│  │          │  │         │  │          │  │             │      │
│  │ Summary  │  │ ROUGE   │  │ LRU      │  │ Test Cases  │      │
│  │ Logic    │  │ BLEU    │  │ TTL      │  │ Reports     │      │
│  │          │  │ Quality │  │ Stats    │  │ Grading     │      │
│  └────┬─────┘  └─────────┘  └─────┬────┘  └─────────────┘      │
│       │                            │                             │
│  ┌────▼────────────────────────────▼────┐                       │
│  │        Analyzer (analyzer.rs)        │                       │
│  │                                       │                       │
│  │  • Text Analysis                     │                       │
│  │  • Sentence Scoring                  │                       │
│  │  • Keyword Extraction                │                       │
│  │  • Language Detection                │                       │
│  └──────────────────────────────────────┘                       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow - Summarization Request

```
User Request
     │
     ▼
┌────────────────────┐
│  Frontend: Submit  │
│  Text for Summary  │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ API: ai_summarize()│
└─────────┬──────────┘
          │
          ▼
    ┌─────────┐
    │ Cache?  │
    └────┬────┘
         │
    ┌────┴────┐
    │ YES     │ NO
    │         │
    ▼         ▼
┌────────┐  ┌──────────────────┐
│ Return │  │ Analyze Text     │
│ Cached │  │ (analyzer.rs)    │
│ Result │  └────────┬─────────┘
└────────┘           │
                     ▼
          ┌──────────────────────┐
          │ Generate Summary     │
          │ (core.rs)            │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Calculate Metrics    │
          │ (metrics.rs)         │
          │                      │
          │ • ROUGE scores       │
          │ • Quality metrics    │
          │ • Performance data   │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Cache Result         │
          │ (cache.rs)           │
          └──────────┬───────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ Return Response      │
          │ with Metrics         │
          └──────────────────────┘
```

## Metrics Calculation Flow

```
Original Text + Summary
         │
         ▼
┌─────────────────────┐
│  SummaryMetrics     │
│  calculate_all()    │
└──────────┬──────────┘
           │
     ┌─────┴─────┬──────────┬──────────┬──────────┐
     │           │          │          │          │
     ▼           ▼          ▼          ▼          ▼
┌─────────┐ ┌──────┐ ┌──────────┐ ┌──────┐ ┌─────────┐
│ ROUGE   │ │ BLEU │ │Coherence │ │ Info │ │Coverage │
│ 1,2,L   │ │Score │ │  Score   │ │ness  │ │  Score  │
└────┬────┘ └───┬──┘ └────┬─────┘ └───┬──┘ └────┬────┘
     │          │         │           │        │
     └──────────┴─────────┴───────────┴────────┘
                         │
                         ▼
              ┌────────────────────┐
              │ Weighted Average   │
              │ Overall Quality    │
              └────────────────────┘
```

## Cache Architecture

```
┌────────────────────────────────────────────────┐
│              SummaryCache                      │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │     HashMap<String, CacheEntry>          │ │
│  │                                          │ │
│  │  Key: hash(text + content_type)         │ │
│  │  Value: {                                │ │
│  │    summary: String,                      │ │
│  │    created_at: u64,                      │ │
│  │    access_count: u32                     │ │
│  │  }                                       │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Settings:                                     │
│  • Max Size: 100 entries                      │
│  • TTL: 3600 seconds (1 hour)                 │
│  • Eviction: LRU (Least Recently Used)        │
│                                                │
│  Operations:                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   get()  │  │   set()  │  │  stats() │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                                │
└────────────────────────────────────────────────┘

Cache Hit Flow:
  Request → Hash → Lookup → Found → Return (Fast!)

Cache Miss Flow:
  Request → Hash → Lookup → Not Found → Process → Cache → Return
```

## Benchmark Test Flow

```
┌──────────────────────────────┐
│   SummarizerBenchmark        │
│   run_comprehensive_suite()  │
└──────────┬───────────────────┘
           │
    ┌──────┴──────┬──────┬──────┬──────┐
    │             │      │      │      │
    ▼             ▼      ▼      ▼      ▼
┌────────┐  ┌────────┐ ┌────┐ ┌─────┐ ┌──────┐
│ Short  │  │Medium  │ │Long│ │Res. │ │Stress│
│ Text   │  │ Text   │ │Text│ │Text │ │ Test │
└───┬────┘  └───┬────┘ └─┬──┘ └──┬──┘ └──┬───┘
    │           │         │       │       │
    └───────────┴─────────┴───────┴───────┘
                      │
                      ▼
           ┌──────────────────┐
           │  For Each Test:  │
           │  1. Summarize    │
           │  2. Measure Time │
           │  3. Calculate    │
           │     Metrics      │
           │  4. Store Result │
           └────────┬─────────┘
                    │
                    ▼
           ┌──────────────────┐
           │  Generate Report │
           │  • Individual    │
           │  • Statistics    │
           │  • Grade A-F     │
           └──────────────────┘
```

## Component Interaction Matrix

```
┌─────────────┬────────┬─────────┬───────┬───────────┐
│ Component   │ Core   │ Metrics │ Cache │ Benchmark │
├─────────────┼────────┼─────────┼───────┼───────────┤
│ Core        │   -    │   Uses  │ Uses  │     -     │
│ Metrics     │   -    │    -    │   -   │   Used    │
│ Cache       │   -    │    -    │   -   │     -     │
│ Benchmark   │  Uses  │  Uses   │   -   │     -     │
│ Endpoints   │  Uses  │    -    │ Uses  │   Uses    │
│ Analyzer    │  Used  │  Used   │   -   │     -     │
└─────────────┴────────┴─────────┴───────┴───────────┘
```

## Performance Optimization Strategy

```
                    Request
                       │
                       ▼
              ┌────────────────┐
              │  Check Cache   │
              └────┬───────┬───┘
                   │       │
              Hit  │       │  Miss
                   │       │
           ┌───────▼       ▼───────┐
           │  Return         Process │
           │  (Fast)         (Slow)  │
           │  ~10ms          ~100ms  │
           │                         │
           │                 ┌───────▼
           │                 │ Cache
           │                 │ Result
           │                 └───┬───
           │                     │
           └─────────────────────┴────
                       │
                       ▼
                  Response

Optimization Layers:
1. Cache Layer    → 10x speedup
2. Algorithm      → Efficient scoring
3. Early Exit     → Short text bypass
4. Metrics        → Parallel calculation
```

## Quality Assurance Pipeline

```
Summary Generated
       │
       ▼
┌──────────────┐
│   Metrics    │
│  Calculated  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Quality Checks:     │
│                      │
│  ✓ ROUGE-1 > 0.3    │
│  ✓ Coherence > 0.5  │
│  ✓ Coverage > 0.4   │
│  ✓ Overall > 0.6    │
└──────┬───────────────┘
       │
   ┌───┴───┐
   │ Pass? │
   └───┬───┘
       │
  ┌────┴────┐
  │ YES     │ NO
  │         │
  ▼         ▼
┌───────┐ ┌──────────┐
│Return │ │ Log/Alert│
│Summary│ │ Low      │
│       │ │ Quality  │
└───────┘ └──────────┘
```

---

Diagram ini menunjukkan:
1. **System Architecture**: Struktur keseluruhan sistem
2. **Data Flow**: Alur data dari request hingga response
3. **Metrics Flow**: Proses perhitungan metrics
4. **Cache Architecture**: Desain caching system
5. **Benchmark Flow**: Alur testing benchmark
6. **Component Interactions**: Hubungan antar komponen
7. **Performance Strategy**: Strategi optimasi
8. **Quality Pipeline**: Pipeline quality assurance
