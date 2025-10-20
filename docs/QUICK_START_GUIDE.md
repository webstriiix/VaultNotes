# 🚀 Quick Start Guide - Summarizer Performance System

## 🎯 Apa yang Baru?

Sistem ini menambahkan kemampuan untuk **mengukur dan meningkatkan performa** model AI summarizer dengan:
- 📊 **9 Quality Metrics** (ROUGE, BLEU, Coherence, dll)
- ⚡ **Caching System** (hingga 10x lebih cepat)
- 🧪 **Benchmark Suite** (testing otomatis)
- 📈 **Real-time Monitoring** (track performa)

## ⚡ Quick Start (5 menit)

### 1. Build & Deploy Lokal

```bash
# Clone atau pull latest code
cd /home/main/projects/encrypted_notes

# Build backend
cargo build --manifest-path src/encrypted-notes-backend/Cargo.toml

# Start dfx
dfx start --clean --background

# Deploy
dfx deploy encrypted-notes-backend
```

### 2. Test Basic Functionality

```bash
# Health check
dfx canister call encrypted-notes-backend ai_health_check_endpoint

# Expected: "AI Service is operational and ready to process requests."
```

### 3. Run Benchmark (See Performance)

```bash
# Run comprehensive benchmark
dfx canister call encrypted-notes-backend run_benchmark_endpoint
```

**Output akan menampilkan:**
```
================================================================================
                    SUMMARIZER PERFORMANCE BENCHMARK REPORT
================================================================================

Test #1: Short Text (News)
--------------------------------------------------------------------------------
  Input Length:        142 characters (23 words)
  Summary Length:      95 characters
  Compression Ratio:   66.90%
  Processing Time:     0.045 seconds
  Quality Score:       0.782/1.0
  Throughput:          3156 chars/sec

...

================================================================================
  Overall Performance Grade: A (Excellent)
================================================================================
```

### 4. Test dengan Teks Sendiri

```bash
dfx canister call encrypted-notes-backend quick_performance_test_endpoint '(
  "Machine learning adalah teknologi yang memungkinkan komputer belajar dari data. \
  Deep learning menggunakan neural networks untuk memproses pola kompleks. \
  Teknologi ini merevolusi berbagai industri seperti kesehatan dan transportasi."
)'
```

### 5. Monitor Cache

```bash
# Cek statistik cache
dfx canister call encrypted-notes-backend get_cache_stats_endpoint

# Output:
# Cache Statistics:
# Size: 0/100
# Avg Age: 0 seconds
# Avg Access Count: 0
# Hit Rate: 0.00%
```

## 💻 Integrasi Frontend (10 menit)

### Update AIService.js

```javascript
// src/services/AIService.js

export const summarizeWithMetrics = async (text, contentType = "general") => {
  const response = await actor.ai_summarize({
    text: text,
    content_type: [contentType],
  });

  // Sekarang ada quality_metrics
  if (response.quality_metrics && response.quality_metrics[0]) {
    console.log('Quality:', response.quality_metrics[0].overall_quality);
  }

  return response;
};
```

### Component Sederhana

```jsx
// components/SimpleSummary.jsx
import { useState } from 'react';

function SimpleSummary() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);

  const handleSummarize = async () => {
    const response = await actor.ai_summarize({
      text: text,
      content_type: ["general"]
    });
    setResult(response);
  };

  return (
    <div>
      <textarea value={text} onChange={e => setText(e.target.value)} />
      <button onClick={handleSummarize}>Summarize</button>
      
      {result && (
        <div>
          <p><strong>Summary:</strong> {result.summary}</p>
          <p><strong>Time:</strong> {result.processing_time}s</p>
          {result.quality_metrics?.[0] && (
            <p><strong>Quality:</strong> {result.quality_metrics[0].overall_quality.toFixed(3)}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## 📊 Use Cases

### Use Case 1: Monitor Quality
```javascript
// Alert jika quality rendah
const response = await summarizeText(text);
if (response.quality_metrics?.[0]?.overall_quality < 0.6) {
  alert('Summary quality is low. Please review.');
}
```

### Use Case 2: Performance Tracking
```javascript
// Track processing times
const times = [];
for (let text of testTexts) {
  const response = await summarizeText(text);
  times.push(response.processing_time);
}
const avgTime = times.reduce((a,b) => a+b) / times.length;
console.log('Average time:', avgTime);
```

### Use Case 3: Cache Monitoring
```bash
# Setup cron job untuk monitoring
# Create: /etc/cron.d/summarizer-monitor
*/5 * * * * dfx canister call encrypted-notes-backend get_cache_stats_endpoint >> /var/log/cache-stats.log
```

## 🎓 Interpretasi Metrics

### Quality Score Guide
| Score | Meaning | Action |
|-------|---------|--------|
| > 0.8 | Excellent | ✅ Ship it! |
| 0.6-0.8 | Good | ✅ Use it |
| 0.4-0.6 | Acceptable | ⚠️ Review |
| < 0.4 | Poor | ❌ Don't use |

### Processing Time Guide
| Time | Meaning | Action |
|------|---------|--------|
| < 0.5s | Fast | ✅ Great UX |
| 0.5-1s | Normal | ✅ Acceptable |
| 1-2s | Slow | ⚠️ Check cache |
| > 2s | Very Slow | ❌ Investigate |

## 🔧 Konfigurasi (Opsional)

### Adjust Cache Settings

Edit `src/encrypted-notes-backend/src/ai/cache.rs`:
```rust
// Ubah di function initialization
SUMMARY_CACHE = SummaryCache::new(
  200,    // Increase max size (default: 100)
  7200    // Increase TTL to 2 hours (default: 3600)
);
```

### Set Quality Threshold

Dalam aplikasi:
```javascript
const QUALITY_THRESHOLD = 0.7;  // Adjust as needed
const TIME_THRESHOLD = 1.5;     // Seconds
```

## 📝 Common Commands

### Development
```bash
# Build
cargo build --manifest-path src/encrypted-notes-backend/Cargo.toml

# Deploy local
dfx deploy encrypted-notes-backend

# Test
dfx canister call encrypted-notes-backend run_benchmark_endpoint
```

### Production
```bash
# Deploy to IC
dfx deploy --network ic encrypted-notes-backend

# Test production
dfx canister --network ic call encrypted-notes-backend ai_health_check_endpoint

# Monitor cache
dfx canister --network ic call encrypted-notes-backend get_cache_stats_endpoint
```

### Maintenance
```bash
# Clear cache
dfx canister call encrypted-notes-backend clear_cache_endpoint

# Clear expired only
dfx canister call encrypted-notes-backend clear_expired_cache_endpoint

# Get cache stats
dfx canister call encrypted-notes-backend get_cache_stats_endpoint
```

## 🐛 Troubleshooting

### Problem: Compilation Error
```bash
# Clean build
cargo clean --manifest-path src/encrypted-notes-backend/Cargo.toml
cargo build --manifest-path src/encrypted-notes-backend/Cargo.toml
```

### Problem: Slow Performance
```bash
# Check cache
dfx canister call encrypted-notes-backend get_cache_stats_endpoint

# If cache is full, clear it
dfx canister call encrypted-notes-backend clear_cache_endpoint
```

### Problem: Low Quality Scores
```bash
# Run benchmark to see baseline
dfx canister call encrypted-notes-backend run_benchmark_endpoint

# Test with known good text
dfx canister call encrypted-notes-backend quick_performance_test_endpoint '("High quality text with clear sentences. Multiple important points. Good structure.")'
```

## 📚 Documentation

Untuk detail lengkap, lihat:
- **Performance Guide**: `docs/SUMMARIZER_PERFORMANCE_GUIDE.md`
- **Usage Examples**: `docs/SUMMARIZER_USAGE_EXAMPLES.md`
- **Architecture**: `docs/SUMMARIZER_ARCHITECTURE_DIAGRAM.md`
- **Deployment**: `docs/DEPLOYMENT_CHECKLIST.md`

## ✅ Checklist Sukses

- [ ] Code compiles tanpa error
- [ ] Benchmark berjalan dengan grade A/B
- [ ] Cache berfungsi (check stats)
- [ ] Frontend dapat akses metrics
- [ ] Quality scores masuk akal (> 0.6)
- [ ] Processing time cepat (< 1s)

## 🎉 Next Steps

1. **Integrate ke UI**: Tampilkan metrics di frontend
2. **Monitor Production**: Setup monitoring dashboard
3. **Optimize**: Tune parameters berdasarkan usage
4. **Iterate**: Improve berdasarkan feedback

## 💡 Tips

1. **Cache Warming**: Run common queries setelah deploy
2. **Baseline**: Save benchmark results sebagai baseline
3. **Monitor**: Track metrics trends over time
4. **Alert**: Set up alerts untuk quality < threshold
5. **Iterate**: Continuously improve berdasarkan data

## 🆘 Need Help?

Jika ada masalah:
1. Check dokumentasi lengkap di `docs/`
2. Review error logs
3. Test dengan text sederhana
4. Verify cache functionality
5. Run benchmark untuk baseline

---

**Selamat! 🎊** Sistem performa summarizer sudah siap digunakan!

Mulai dengan benchmark, integrate ke frontend, dan monitor hasilnya.
