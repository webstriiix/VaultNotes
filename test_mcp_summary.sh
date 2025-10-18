#!/bin/bash
# Test improved summarization with MCP text

echo "🧪 Testing Improved Summarization Algorithm"
echo "==========================================="
echo ""

TEXT="Model Context Protocol (MCP) adalah standar terbuka yang memungkinkan Large Language Models (LLM) untuk berinteraksi dengan data dan layanan eksternal dengan cara yang terpadu. Anthropic memperkenalkan MCP pada akhir 2024 untuk memecahkan masalah integrasi yang rumit antara LLM dan berbagai sumber daya. Mengapa MCP dibutuhkan? Sebelum ada MCP, pengembang harus membuat koneksi khusus (dikenal sebagai glue code) untuk setiap LLM yang ingin dihubungkan dengan alat dan data eksternal, seperti database, API pihak ketiga, atau file lokal. Pendekatan ini tidak efisien dan sulit dipertahankan seiring pertumbuhan ekosistem LLM dan alat-alatnya. MCP mengatasi masalah ini dengan menyediakan port universal atau standar komunikasi yang sama untuk semua LLM. Mirip dengan cara kerja port USB-C pada komputer, MCP memungkinkan model AI untuk mencolokkan dan berkomunikasi dengan sumber data apa pun yang mendukung protokol tersebut. Bagaimana cara kerja MCP? MCP bekerja berdasarkan arsitektur klien-server yang terdiri dari beberapa komponen utama: Host (Aplikasi AI): Aplikasi yang menggunakan LLM, seperti agen AI atau chatbot, untuk melakukan tugas. Klien MCP: Komponen yang berada di dalam aplikasi host dan berfungsi untuk mengirim permintaan konteks dari LLM ke server MCP yang sesuai. Server MCP: Program ringan yang mengekspos data dan fungsionalitas dari sistem eksternal, seperti database perusahaan atau API pihak ketiga. Layanan Eksternal: Sumber data asli, seperti file, database, atau layanan API yang datanya diakses oleh server MCP."

echo "📝 Input Text:"
echo "Length: ${#TEXT} characters"
echo ""

echo "🔄 Calling ai_summarize..."
echo ""

dfx canister call encrypted-notes-backend ai_summarize "(record { 
  text = \"$TEXT\"; 
  content_type = opt \"technical\" 
})"

echo ""
echo "✅ Test completed!"
