# Contoh Penggunaan Sistem Performa Summarizer

## 1. Testing Performa dengan Benchmark

### A. Menggunakan dfx canister call

```bash
# 1. Deploy canister terlebih dahulu
dfx deploy encrypted-notes-backend

# 2. Run comprehensive benchmark
dfx canister call encrypted-notes-backend run_benchmark_endpoint

# Output:
# ================================================================================
#                     SUMMARIZER PERFORMANCE BENCHMARK REPORT
# ================================================================================
# 
# Test #1: Short Text (News)
# --------------------------------------------------------------------------------
#   Input Length:        142 characters (23 words)
#   Summary Length:      95 characters
#   Compression Ratio:   66.90%
#   Processing Time:     0.045 seconds
#   Quality Score:       0.782/1.0
#   Throughput:          3156 chars/sec
# ...
```

### B. Quick Test dengan Teks Custom

```bash
# Test dengan teks Anda sendiri
dfx canister call encrypted-notes-backend quick_performance_test_endpoint '(
  "Machine learning has revolutionized many industries. \
  It enables computers to learn from data and make predictions. \
  Deep learning is a subset of machine learning that uses neural networks. \
  These technologies are transforming healthcare, finance, and transportation."
)'

# Output akan menampilkan metrics lengkap untuk teks tersebut
```

## 2. Monitoring Cache Performance

```bash
# Cek statistik cache
dfx canister call encrypted-notes-backend get_cache_stats_endpoint

# Output:
# Cache Statistics:
# Size: 45/100
# Avg Age: 542 seconds
# Avg Access Count: 3
# Hit Rate: 67.23%

# Clear cache jika diperlukan
dfx canister call encrypted-notes-backend clear_cache_endpoint

# Clear hanya entry yang expired
dfx canister call encrypted-notes-backend clear_expired_cache_endpoint
```

## 3. Menggunakan Metrics dalam Aplikasi

### A. Frontend (JavaScript/TypeScript)

```javascript
// src/services/AIService.js

export const summarizeWithMetrics = async (text, contentType = "general") => {
  try {
    const response = await actor.ai_summarize({
      text: text,
      content_type: [contentType],
    });

    // Response sekarang termasuk quality_metrics
    if (response.quality_metrics && response.quality_metrics[0]) {
      const metrics = response.quality_metrics[0];
      
      console.log('Summary Quality:', {
        rouge1: metrics.rouge_1,
        coherence: metrics.coherence_score,
        readability: metrics.readability_score,
        overall: metrics.overall_quality
      });

      // Alert jika kualitas rendah
      if (metrics.overall_quality < 0.6) {
        console.warn('Low quality summary detected');
      }
    }

    return response;
  } catch (error) {
    console.error('Summarization error:', error);
    throw error;
  }
};

// Contoh penggunaan
const text = `
  Your long text here...
  Multiple paragraphs...
  Important information...
`;

const result = await summarizeWithMetrics(text, "technical");
console.log('Summary:', result.summary);
console.log('Processing Time:', result.processing_time, 'seconds');
console.log('Compression:', (result.compression_ratio * 100).toFixed(2) + '%');
```

### B. React Component dengan Metrics Display

```jsx
// components/ai/SummaryWithMetrics.jsx

import React, { useState } from 'react';
import { summarizeWithMetrics } from '../../services/AIService';

const SummaryWithMetrics = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const response = await summarizeWithMetrics(text);
      setResult(response);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AI Summarizer with Metrics</h2>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to summarize..."
        className="w-full h-40 p-3 border rounded-lg mb-4"
      />

      <button
        onClick={handleSummarize}
        disabled={loading || !text}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Summarize'}
      </button>

      {result && (
        <div className="mt-6 space-y-4">
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Summary:</h3>
            <p>{result.summary}</p>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border p-4 rounded-lg">
            <h3 className="font-bold mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="text-lg font-semibold">
                  {(result.processing_time * 1000).toFixed(2)} ms
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Compression</p>
                <p className="text-lg font-semibold">
                  {(result.compression_ratio * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Method</p>
                <p className="text-lg font-semibold">{result.method}</p>
              </div>
              {result.quality_metrics && result.quality_metrics[0] && (
                <div>
                  <p className="text-sm text-gray-600">Quality Score</p>
                  <p className={`text-lg font-semibold ${getQualityColor(result.quality_metrics[0].overall_quality)}`}>
                    {result.quality_metrics[0].overall_quality.toFixed(3)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quality Metrics Detail */}
          {result.quality_metrics && result.quality_metrics[0] && (
            <div className="bg-white border p-4 rounded-lg">
              <h3 className="font-bold mb-3">Quality Metrics Detail</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">ROUGE-1</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].rouge_1.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">ROUGE-2</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].rouge_2.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">ROUGE-L</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].rouge_l.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Informativeness</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].informativeness.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Coherence</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].coherence_score.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Readability</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].readability_score.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Redundancy</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].redundancy_score.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Coverage</p>
                  <p className="font-semibold">
                    {result.quality_metrics[0].coverage_score.toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryWithMetrics;
```

## 4. Automated Testing Script

```javascript
// scripts/test-summarizer-performance.js

const { Actor, HttpAgent } = require('@dfinity/agent');
const { idlFactory } = require('../src/declarations/encrypted-notes-backend');

async function testSummarizerPerformance() {
  // Setup agent
  const agent = new HttpAgent({ host: 'http://localhost:4943' });
  await agent.fetchRootKey(); // Only for local development

  // Create actor
  const canisterId = process.env.CANISTER_ID_ENCRYPTED_NOTES_BACKEND;
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });

  console.log('🧪 Running Summarizer Performance Tests...\n');

  // Test cases
  const testCases = [
    {
      name: 'Short News Article',
      text: 'Breaking news: Scientists discover new planet...',
      type: 'news',
    },
    {
      name: 'Meeting Notes',
      text: 'Meeting Notes - Project Update\nDate: Today\n...',
      type: 'meeting',
    },
    {
      name: 'Technical Document',
      text: 'Introduction to Machine Learning...',
      type: 'technical',
    },
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    
    const startTime = Date.now();
    const response = await actor.ai_summarize({
      text: testCase.text,
      content_type: [testCase.type],
    });
    const endTime = Date.now();

    const result = {
      name: testCase.name,
      inputLength: testCase.text.length,
      summaryLength: response.summary.length,
      compressionRatio: response.compression_ratio,
      processingTime: response.processing_time,
      totalTime: (endTime - startTime) / 1000,
      method: response.method,
      qualityScore: response.quality_metrics?.[0]?.overall_quality || 0,
    };

    results.push(result);

    console.log(`✅ Completed in ${result.totalTime.toFixed(3)}s`);
    console.log(`   Quality: ${result.qualityScore.toFixed(3)}`);
    console.log(`   Compression: ${(result.compressionRatio * 100).toFixed(1)}%\n`);
  }

  // Summary
  console.log('=' .repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  
  const avgQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
  
  console.log(`Average Quality Score: ${avgQuality.toFixed(3)}`);
  console.log(`Average Processing Time: ${avgTime.toFixed(3)}s`);
  
  const grade = avgQuality >= 0.8 && avgTime < 1.0 ? 'A' :
                avgQuality >= 0.7 && avgTime < 2.0 ? 'B' :
                avgQuality >= 0.6 && avgTime < 3.0 ? 'C' : 'D';
  
  console.log(`Overall Grade: ${grade}`);
}

// Run tests
testSummarizerPerformance()
  .then(() => console.log('\n✅ All tests completed'))
  .catch((error) => console.error('❌ Test failed:', error));
```

## 5. Continuous Monitoring Script

```bash
#!/bin/bash
# scripts/monitor-summarizer.sh

echo "🔍 Monitoring Summarizer Performance"
echo "===================================="
echo ""

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Checking cache stats..."
  
  # Get cache stats
  STATS=$(dfx canister call encrypted-notes-backend get_cache_stats_endpoint)
  echo "$STATS"
  echo ""
  
  # Clear expired entries every hour
  HOUR=$(date +%H)
  if [ "$HOUR" == "00" ]; then
    echo "Clearing expired cache entries..."
    dfx canister call encrypted-notes-backend clear_expired_cache_endpoint
  fi
  
  # Wait 5 minutes before next check
  sleep 300
done
```

## 6. Performance Comparison Test

```bash
# scripts/compare-performance.sh

echo "📊 Performance Comparison Test"
echo "=============================="
echo ""

# Test text
TEXT="Machine learning is a subset of artificial intelligence that enables computers to learn from data and improve their performance over time without being explicitly programmed. Deep learning, a more advanced technique within machine learning, uses neural networks with multiple layers to process complex patterns in data."

# Test 1: First run (no cache)
echo "Test 1: First run (no cache)"
dfx canister call encrypted-notes-backend clear_cache_endpoint > /dev/null
START=$(date +%s.%N)
RESULT1=$(dfx canister call encrypted-notes-backend quick_performance_test_endpoint "(\"$TEXT\")")
END=$(date +%s.%N)
TIME1=$(echo "$END - $START" | bc)
echo "Total time (with network): ${TIME1}s"
echo "$RESULT1" | grep "Processing Time"
echo ""

# Test 2: Second run (with cache)
echo "Test 2: Second run (with cache)"
START=$(date +%s.%N)
RESULT2=$(dfx canister call encrypted-notes-backend quick_performance_test_endpoint "(\"$TEXT\")")
END=$(date +%s.%N)
TIME2=$(echo "$END - $START" | bc)
echo "Total time (with network): ${TIME2}s"
echo "$RESULT2" | grep "Processing Time"
echo ""

# Calculate speedup
SPEEDUP=$(echo "scale=2; $TIME1 / $TIME2" | bc)
echo "Cache speedup: ${SPEEDUP}x faster"
```

## Tips & Best Practices

### 1. Kapan Menggunakan Benchmark
- Setelah perubahan algoritma
- Sebelum deployment production
- Weekly performance review
- Saat ada laporan performa lambat

### 2. Interpretasi Hasil
- **Quality Score > 0.7**: Bagus, siap production
- **Quality Score 0.5-0.7**: Acceptable, bisa diperbaiki
- **Quality Score < 0.5**: Perlu perbaikan serius

### 3. Optimasi
- Monitor cache hit rate, target > 60%
- Processing time idealnya < 1 detik
- Compression ratio optimal 30-40%

### 4. Monitoring Production
- Set up alerts untuk quality < 0.6
- Track processing time trends
- Monitor cache efficiency
