// Benchmark Suite for Summarizer Performance Testing
// src/encrypted-notes-backend/src/ai/benchmark.rs

use super::core::summarize_text;
use super::metrics::{SummaryMetrics, PerformanceMetrics};
use super::types::{SummaryRequest, SummaryResponse};

/// Benchmark result for a single test case
#[derive(Clone, Debug)]
pub struct BenchmarkResult {
    pub test_name: String,
    pub text_length: usize,
    pub word_count: usize,
    pub summary_length: usize,
    pub processing_time: f64,
    pub quality_score: f64,
    pub compression_ratio: f64,
    pub throughput_chars_per_sec: f64,
}

/// Comprehensive benchmark suite
pub struct SummarizerBenchmark {
    pub results: Vec<BenchmarkResult>,
}

impl SummarizerBenchmark {
    pub fn new() -> Self {
        SummarizerBenchmark {
            results: Vec::new(),
        }
    }

    /// Run a single benchmark test
    pub fn run_test(&mut self, test_name: &str, text: &str, content_type: Option<String>) {
        let request = SummaryRequest {
            text: text.to_string(),
            content_type,
        };

        let response = summarize_text(request);

        let word_count = text.split_whitespace().count();
        
        let quality_score = if let Some(ref metrics) = response.quality_metrics {
            metrics.overall_quality
        } else {
            0.0
        };

        let throughput = if response.processing_time > 0.0 {
            text.len() as f64 / response.processing_time
        } else {
            0.0
        };

        self.results.push(BenchmarkResult {
            test_name: test_name.to_string(),
            text_length: text.len(),
            word_count,
            summary_length: response.summary.len(),
            processing_time: response.processing_time,
            quality_score,
            compression_ratio: response.compression_ratio,
            throughput_chars_per_sec: throughput,
        });
    }

    /// Run comprehensive benchmark suite
    pub fn run_comprehensive_suite(&mut self) {
        // Test 1: Short text (news headline)
        let short_text = "Breaking news: Scientists discover new planet in distant solar system. \
                         The planet, named Kepler-452c, orbits its star in the habitable zone.";
        self.run_test("Short Text (News)", short_text, Some("news".to_string()));

        // Test 2: Medium text (meeting notes)
        let medium_text = "Meeting Notes - Project Status Update\n\
            Date: October 18, 2025\n\
            Attendees: John, Sarah, Mike, Lisa\n\n\
            Agenda:\n\
            1. Review last sprint deliverables\n\
            2. Discuss current blockers\n\
            3. Plan next sprint\n\n\
            Discussion:\n\
            - Backend API is 80% complete, needs testing\n\
            - Frontend integration facing authentication issues\n\
            - Database migration scheduled for next week\n\
            - User testing feedback was positive overall\n\n\
            Action Items:\n\
            - John: Fix authentication bug by Friday\n\
            - Sarah: Complete API documentation\n\
            - Mike: Prepare database migration scripts\n\
            - Lisa: Schedule user testing session\n\n\
            Next meeting: October 25, 2025";
        self.run_test("Medium Text (Meeting)", medium_text, Some("meeting".to_string()));

        // Test 3: Long text (technical document)
        let long_text = "Introduction to Machine Learning in Healthcare\n\n\
            Machine learning (ML) has emerged as a transformative technology in healthcare, \
            offering unprecedented opportunities to improve patient outcomes, reduce costs, \
            and enhance the efficiency of medical practice. This document provides a comprehensive \
            overview of ML applications in healthcare, covering both current implementations \
            and future prospects.\n\n\
            Current Applications:\n\n\
            1. Diagnostic Imaging: ML algorithms have demonstrated remarkable accuracy in \
            analyzing medical images, including X-rays, MRIs, and CT scans. Deep learning \
            models can detect abnormalities with accuracy comparable to or exceeding human \
            radiologists in specific domains such as diabetic retinopathy screening and \
            lung nodule detection.\n\n\
            2. Predictive Analytics: Healthcare providers use ML models to predict patient \
            outcomes, readmission risks, and disease progression. These predictions enable \
            proactive interventions and personalized treatment plans.\n\n\
            3. Drug Discovery: ML accelerates the drug discovery process by predicting \
            molecular properties, identifying potential drug candidates, and optimizing \
            clinical trial designs. This can reduce the time and cost of bringing new \
            therapies to market.\n\n\
            4. Personalized Medicine: ML algorithms analyze patient data including genomics, \
            medical history, and lifestyle factors to recommend tailored treatment strategies. \
            This approach maximizes treatment efficacy while minimizing adverse effects.\n\n\
            Challenges and Considerations:\n\n\
            Despite its promise, ML in healthcare faces several challenges. Data quality and \
            availability remain significant barriers, as ML models require large, diverse, \
            and well-annotated datasets. Privacy concerns and regulatory requirements add \
            complexity to data sharing and model deployment. Additionally, ensuring model \
            interpretability and addressing bias in training data are critical for clinical \
            adoption and patient trust.\n\n\
            Future Directions:\n\n\
            The future of ML in healthcare looks promising, with emerging applications in \
            areas such as mental health assessment, surgical robotics, and epidemic prediction. \
            As technology advances and regulatory frameworks evolve, ML is expected to become \
            an integral part of routine medical practice, ultimately leading to improved \
            healthcare outcomes for all.";
        self.run_test("Long Text (Technical)", long_text, Some("technical".to_string()));

        // Test 4: Research abstract
        let research_text = "Abstract\n\
            Background: Cardiovascular diseases remain the leading cause of mortality worldwide. \
            Early detection and intervention are crucial for improving patient outcomes.\n\
            Objective: This study evaluates the effectiveness of a novel machine learning algorithm \
            for predicting cardiovascular events using routine clinical data.\n\
            Methods: We conducted a retrospective cohort study involving 10,000 patients from \
            multiple healthcare centers. Patient data including demographics, vital signs, \
            laboratory results, and medical history were collected. A gradient boosting model \
            was trained to predict cardiovascular events within 5 years.\n\
            Results: The model achieved an AUC of 0.87 (95% CI: 0.85-0.89) with sensitivity \
            of 82% and specificity of 79%. Key predictive features included age, blood pressure, \
            cholesterol levels, and smoking history. The model outperformed traditional risk \
            scores (Framingham, SCORE) by 12-15%.\n\
            Conclusions: Our machine learning approach demonstrates superior predictive accuracy \
            for cardiovascular events compared to traditional risk assessment tools. Implementation \
            in clinical practice could enable more targeted preventive interventions and improve \
            patient outcomes.";
        self.run_test("Research Abstract", research_text, Some("research".to_string()));

        // Test 5: Stress test - very long text
        let stress_text = long_text.repeat(5);
        self.run_test("Stress Test (5x Long)", &stress_text, Some("technical".to_string()));
    }

    /// Generate a comprehensive report
    pub fn generate_report(&self) -> String {
        if self.results.is_empty() {
            return "No benchmark results available.".to_string();
        }

        let mut report = String::from("=" .repeat(80));
        report.push_str("\n                    SUMMARIZER PERFORMANCE BENCHMARK REPORT\n");
        report.push_str(&"=".repeat(80));
        report.push_str("\n\n");

        // Individual test results
        for (idx, result) in self.results.iter().enumerate() {
            report.push_str(&format!("Test #{}: {}\n", idx + 1, result.test_name));
            report.push_str(&"-".repeat(80));
            report.push_str("\n");
            report.push_str(&format!("  Input Length:        {} characters ({} words)\n", 
                result.text_length, result.word_count));
            report.push_str(&format!("  Summary Length:      {} characters\n", result.summary_length));
            report.push_str(&format!("  Compression Ratio:   {:.2}%\n", result.compression_ratio * 100.0));
            report.push_str(&format!("  Processing Time:     {:.3} seconds\n", result.processing_time));
            report.push_str(&format!("  Quality Score:       {:.3}/1.0\n", result.quality_score));
            report.push_str(&format!("  Throughput:          {:.0} chars/sec\n", result.throughput_chars_per_sec));
            report.push_str("\n");
        }

        // Summary statistics
        report.push_str(&"=".repeat(80));
        report.push_str("\n                          SUMMARY STATISTICS\n");
        report.push_str(&"=".repeat(80));
        report.push_str("\n\n");

        let avg_processing_time: f64 = self.results.iter()
            .map(|r| r.processing_time)
            .sum::<f64>() / self.results.len() as f64;

        let avg_quality: f64 = self.results.iter()
            .map(|r| r.quality_score)
            .sum::<f64>() / self.results.len() as f64;

        let avg_compression: f64 = self.results.iter()
            .map(|r| r.compression_ratio)
            .sum::<f64>() / self.results.len() as f64;

        let avg_throughput: f64 = self.results.iter()
            .map(|r| r.throughput_chars_per_sec)
            .sum::<f64>() / self.results.len() as f64;

        let min_processing_time = self.results.iter()
            .map(|r| r.processing_time)
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        let max_processing_time = self.results.iter()
            .map(|r| r.processing_time)
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        report.push_str(&format!("  Average Processing Time:   {:.3} seconds\n", avg_processing_time));
        report.push_str(&format!("  Min Processing Time:       {:.3} seconds\n", min_processing_time));
        report.push_str(&format!("  Max Processing Time:       {:.3} seconds\n", max_processing_time));
        report.push_str(&format!("  Average Quality Score:     {:.3}/1.0\n", avg_quality));
        report.push_str(&format!("  Average Compression:       {:.2}%\n", avg_compression * 100.0));
        report.push_str(&format!("  Average Throughput:        {:.0} chars/sec\n", avg_throughput));
        report.push_str("\n");

        // Performance grade
        let grade = if avg_quality >= 0.8 && avg_processing_time < 1.0 {
            "A (Excellent)"
        } else if avg_quality >= 0.7 && avg_processing_time < 2.0 {
            "B (Good)"
        } else if avg_quality >= 0.6 && avg_processing_time < 3.0 {
            "C (Acceptable)"
        } else if avg_quality >= 0.5 {
            "D (Needs Improvement)"
        } else {
            "F (Poor)"
        };

        report.push_str(&"=".repeat(80));
        report.push_str("\n");
        report.push_str(&format!("  Overall Performance Grade: {}\n", grade));
        report.push_str(&"=".repeat(80));
        report.push_str("\n");

        report
    }

    /// Export results as CSV
    pub fn export_csv(&self) -> String {
        let mut csv = String::from("Test Name,Text Length,Word Count,Summary Length,Processing Time (s),Quality Score,Compression Ratio,Throughput (chars/s)\n");
        
        for result in &self.results {
            csv.push_str(&format!(
                "{},{},{},{},{:.3},{:.3},{:.3},{:.0}\n",
                result.test_name,
                result.text_length,
                result.word_count,
                result.summary_length,
                result.processing_time,
                result.quality_score,
                result.compression_ratio,
                result.throughput_chars_per_sec
            ));
        }
        
        csv
    }
}

/// Quick performance test function
pub fn quick_performance_test(text: &str) -> String {
    let mut benchmark = SummarizerBenchmark::new();
    benchmark.run_test("Quick Test", text, None);
    benchmark.generate_report()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_benchmark_suite() {
        let mut benchmark = SummarizerBenchmark::new();
        benchmark.run_comprehensive_suite();
        
        assert!(!benchmark.results.is_empty());
        assert_eq!(benchmark.results.len(), 5);
        
        let report = benchmark.generate_report();
        assert!(report.contains("BENCHMARK REPORT"));
    }

    #[test]
    fn test_csv_export() {
        let mut benchmark = SummarizerBenchmark::new();
        benchmark.run_test("Test", "This is a test text for benchmarking.", None);
        
        let csv = benchmark.export_csv();
        assert!(csv.contains("Test Name"));
        assert!(csv.contains("Processing Time"));
    }
}
