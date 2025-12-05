#!/usr/bin/env node

/**
 * Bundle Analysis Script for SPARC Workflow Performance
 * Analyzes Next.js bundle sizes and identifies optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.join(process.cwd(), '.next');
    this.metricsDir = path.join(process.cwd(), '.claude-flow/metrics');
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      recommendations: [],
      performance: {}
    };
  }

  async analyze() {
    console.log('🔍 Starting Bundle Analysis...\n');

    try {
      // Ensure build exists
      if (!fs.existsSync(this.buildDir)) {
        console.log('📦 Building project for analysis...');
        execSync('npm run build', { stdio: 'inherit' });
      }

      // Analyze bundle sizes
      await this.analyzeBundleSizes();
      
      // Check for optimization opportunities
      await this.checkOptimizations();
      
      // Generate performance report
      await this.generateReport();
      
      // Store metrics
      await this.storeMetrics();

      console.log('\n✅ Bundle analysis complete!');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeBundleSizes() {
    console.log('📊 Analyzing bundle sizes...');
    
    const staticDir = path.join(this.buildDir, 'static', 'chunks');
    
    if (!fs.existsSync(staticDir)) {
      throw new Error('Static chunks directory not found');
    }

    const chunks = fs.readdirSync(staticDir).filter(file => file.endsWith('.js'));
    
    for (const chunk of chunks) {
      const chunkPath = path.join(staticDir, chunk);
      const stats = fs.statSync(chunkPath);
      const sizeKB = Math.round(stats.size / 1024);
      
      this.results.bundleSize[chunk] = {
        size: stats.size,
        sizeKB,
        category: this.categorizeChunk(chunk)
      };
    }

    // Analyze pages
    const pagesDir = path.join(staticDir, 'pages');
    if (fs.existsSync(pagesDir)) {
      const pageChunks = fs.readdirSync(pagesDir).filter(file => file.endsWith('.js'));
      let totalPagesSize = 0;
      
      pageChunks.forEach(chunk => {
        const chunkPath = path.join(pagesDir, chunk);
        const stats = fs.statSync(chunkPath);
        totalPagesSize += stats.size;
      });
      
      this.results.bundleSize['total-pages'] = {
        size: totalPagesSize,
        sizeKB: Math.round(totalPagesSize / 1024),
        category: 'pages'
      };
    }
  }

  categorizeChunk(filename) {
    if (filename.includes('framework')) return 'framework';
    if (filename.includes('main')) return 'main';
    if (filename.includes('polyfill')) return 'polyfills';
    if (filename.includes('webpack')) return 'webpack';
    if (filename.includes('pages')) return 'pages';
    return 'vendor';
  }

  async checkOptimizations() {
    console.log('🔧 Checking optimization opportunities...');
    
    const { bundleSize } = this.results;
    
    // Check for large chunks
    Object.entries(bundleSize).forEach(([chunk, data]) => {
      if (data.sizeKB > 100) {
        this.results.recommendations.push({
          type: 'large-chunk',
          chunk,
          size: data.sizeKB,
          message: `${chunk} is ${data.sizeKB}KB - consider code splitting`,
          priority: data.sizeKB > 200 ? 'high' : 'medium'
        });
      }
    });

    // Check framework size
    const frameworkChunk = Object.entries(bundleSize).find(([name]) => name.includes('framework'));
    if (frameworkChunk && frameworkChunk[1].sizeKB > 150) {
      this.results.recommendations.push({
        type: 'framework-optimization',
        message: 'Framework bundle is large - check for unnecessary React features',
        priority: 'medium'
      });
    }

    // Check pages total size
    const pagesTotal = bundleSize['total-pages'];
    if (pagesTotal && pagesTotal.sizeKB > 400) {
      this.results.recommendations.push({
        type: 'pages-optimization',
        message: `Total pages size is ${pagesTotal.sizeKB}KB - implement dynamic imports`,
        priority: 'high'
      });
    }
  }

  async generateReport() {
    console.log('📝 Generating performance report...');
    
    const totalSize = Object.values(this.results.bundleSize)
      .reduce((sum, chunk) => sum + chunk.size, 0);
    
    this.results.performance = {
      totalBundleSize: Math.round(totalSize / 1024),
      totalChunks: Object.keys(this.results.bundleSize).length,
      recommendations: this.results.recommendations.length,
      score: this.calculatePerformanceScore()
    };

    // Console output
    console.log('\n📈 Bundle Analysis Results:');
    console.log(`   Total Bundle Size: ${this.results.performance.totalBundleSize}KB`);
    console.log(`   Total Chunks: ${this.results.performance.totalChunks}`);
    console.log(`   Performance Score: ${this.results.performance.score}/100`);
    console.log(`   Recommendations: ${this.results.recommendations.length}`);

    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Optimization Recommendations:');
      this.results.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`   ${index + 1}. ${priority} ${rec.message}`);
      });
    }
  }

  calculatePerformanceScore() {
    let score = 100;
    const { bundleSize, recommendations } = this.results;
    
    // Deduct points for large bundles
    const totalKB = Object.values(bundleSize).reduce((sum, chunk) => sum + chunk.sizeKB, 0);
    if (totalKB > 200) score -= Math.min(30, (totalKB - 200) * 0.2);
    
    // Deduct points for recommendations
    recommendations.forEach(rec => {
      if (rec.priority === 'high') score -= 15;
      else if (rec.priority === 'medium') score -= 10;
      else score -= 5;
    });
    
    return Math.max(0, Math.round(score));
  }

  async storeMetrics() {
    console.log('💾 Storing metrics...');
    
    // Ensure metrics directory exists
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }

    const metricsFile = path.join(this.metricsDir, 'bundle-analysis.json');
    
    // Load existing metrics
    let existingMetrics = [];
    if (fs.existsSync(metricsFile)) {
      try {
        existingMetrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      } catch (e) {
        existingMetrics = [];
      }
    }

    // Add new analysis
    existingMetrics.push(this.results);
    
    // Keep only last 10 analyses
    if (existingMetrics.length > 10) {
      existingMetrics = existingMetrics.slice(-10);
    }

    // Save metrics
    fs.writeFileSync(metricsFile, JSON.stringify(existingMetrics, null, 2));
    
    console.log(`   Metrics saved to: ${metricsFile}`);
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = BundleAnalyzer;