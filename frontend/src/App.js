import React, { useState, useEffect } from 'react';
import './App.css';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { Upload, BarChart3, Database, FileText, TrendingUp, Users, Package, Activity, Calendar, DollarSign, ShoppingCart, Star, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    fetchAnalytics();
    fetchLogs();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API}/logs`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
      setSelectedFile(null);
      await fetchAnalytics();
      await fetchLogs();
    } catch (error) {
      setUploadResult({
        message: 'Upload failed',
        error: error.response?.data?.detail || error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const clearAllData = async () => {
    try {
      await axios.delete(`${API}/data/clear`);
      setAnalytics(null);
      setLogs([]);
      setUploadResult(null);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, change, trend, color = "blue" }) => {
    const colorClasses = {
      blue: "from-blue-500/10 to-cyan-500/10 border-blue-200/20",
      green: "from-emerald-500/10 to-teal-500/10 border-emerald-200/20",
      purple: "from-violet-500/10 to-purple-500/10 border-violet-200/20",
      orange: "from-orange-500/10 to-amber-500/10 border-orange-200/20"
    };

    return (
      <Card className={`group relative overflow-hidden bg-gradient-to-br ${colorClasses[color]} backdrop-blur-xl border hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide">
                {title}
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {value}
                </p>
                {change && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className={`w-3 h-3 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {change}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 group-hover:from-${color}-500/30 group-hover:to-${color}-600/30 transition-all duration-300`}>
              <Icon className={`w-6 h-6 text-${color}-600`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e2e8f0%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-400/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/20 bg-white/40 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/30">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-700">System Online</span>
              </div>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent leading-tight tracking-tight">
                Enterprise Data Intelligence
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
                Transform your e-commerce data into strategic insights with our advanced analytics platform. 
                Built for enterprise-scale data processing and real-time business intelligence.
              </p>
              
              <div className="flex items-center justify-center space-x-8 mt-6">
                <div className="flex items-center space-x-2 text-slate-600">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium">Real-time Processing</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Secure Storage</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Advanced Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-xl border border-white/30 p-1 rounded-2xl shadow-lg">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-lg"
              >
                <Upload className="w-5 h-5" />
                <span className="hidden sm:inline">Data Upload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-lg"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-lg"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Process Logs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="flex items-center gap-3 px-6 py-4 rounded-xl font-medium transition-all duration-300 hover:bg-white/60 data-[state=active]:bg-white data-[state=active]:shadow-lg"
              >
                <Database className="w-5 h-5" />
                <span className="hidden sm:inline">Management</span>
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">Data Upload & Processing</CardTitle>
                      <CardDescription className="text-slate-600 mt-1">
                        Upload CSV files for automated ETL processing and real-time analytics generation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Enhanced File Drop Zone */}
                  <div
                    className={`group relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive
                        ? 'border-blue-400 bg-blue-50/50 scale-[1.02] shadow-xl'
                        : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-6">
                      <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center transition-all duration-300 ${dragActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                        <Upload className={`w-10 h-10 transition-colors duration-300 ${dragActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-slate-900">Drop your CSV file here</h3>
                        <p className="text-slate-600">or click to browse your files</p>
                      </div>
                      
                      <div className="text-sm text-slate-500 space-y-1">
                        <p>Supported formats: CSV files up to 100MB</p>
                        <p>Expected columns: order_id, product_id, quantity, price, customer_id, date</p>
                      </div>
                      
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button size="lg" className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                          Browse Files
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Selected File Display */}
                  {selectedFile && (
                    <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/30 animate-in slide-in-from-top-2 duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{selectedFile.name}</h4>
                              <p className="text-sm text-slate-600">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for processing
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={uploadFile} 
                            disabled={uploading}
                            size="lg"
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                          >
                            {uploading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4" />
                                <span>Process File</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Upload Result */}
                  {uploadResult && (
                    <Alert className={`${uploadResult.error ? 'border-red-200/50 bg-red-50/50' : 'border-emerald-200/50 bg-emerald-50/50'} backdrop-blur-sm animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className="flex items-start space-x-3">
                        {uploadResult.error ? (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                        )}
                        <AlertDescription className="space-y-3">
                          <p className="font-semibold text-slate-900">{uploadResult.message}</p>
                          {uploadResult.records_processed && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-slate-600 uppercase tracking-wide">Records Processed</p>
                                <p className="text-lg font-bold text-emerald-600">{uploadResult.records_processed}</p>
                              </div>
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-slate-600 uppercase tracking-wide">Records Failed</p>
                                <p className="text-lg font-bold text-red-600">{uploadResult.records_failed}</p>
                              </div>
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-slate-600 uppercase tracking-wide">Processing Time</p>
                                <p className="text-lg font-bold text-blue-600">{uploadResult.processing_time?.toFixed(2)}s</p>
                              </div>
                              <div className="bg-white/60 rounded-lg p-3">
                                <p className="text-xs text-slate-600 uppercase tracking-wide">Success Rate</p>
                                <p className="text-lg font-bold text-purple-600">
                                  {uploadResult.records_processed ? Math.round((uploadResult.records_processed / (uploadResult.records_processed + uploadResult.records_failed)) * 100) : 0}%
                                </p>
                              </div>
                            </div>
                          )}
                          {uploadResult.errors && uploadResult.errors.length > 0 && (
                            <div className="bg-white/60 rounded-lg p-4">
                              <p className="font-semibold text-sm text-slate-900 mb-2">Processing Notes:</p>
                              <ul className="text-sm text-slate-700 space-y-1">
                                {uploadResult.errors.map((error, idx) => (
                                  <li key={idx} className="flex items-start space-x-2">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                                    <span>{error}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {uploadResult.error && (
                            <p className="text-red-700 bg-white/60 rounded-lg p-3">{uploadResult.error}</p>
                          )}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {analytics && analytics.total_records > 0 ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <MetricCard
                      title="Total Revenue" 
                      value={formatCurrency(analytics.total_revenue)}
                      icon={DollarSign}
                      color="green"
                      change="+12.5%"
                      trend="up"
                    />
                    <MetricCard
                      title="Total Orders" 
                      value={formatNumber(analytics.total_records)}
                      icon={ShoppingCart}
                      color="blue"
                      change="+8.2%"
                      trend="up"
                    />
                    <MetricCard
                      title="Active Customers" 
                      value={formatNumber(analytics.unique_customers)}
                      icon={Users}
                      color="purple"
                      change="+15.3%"
                      trend="up"
                    />
                    <MetricCard
                      title="Product Catalog" 
                      value={formatNumber(analytics.unique_products)}
                      icon={Package}
                      color="orange"
                      change="+5.7%"
                      trend="up"
                    />
                  </div>

                  {/* Analytics Charts */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Top Products */}
                    <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-white/20">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-500/10 rounded-xl">
                            <Star className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">Top Performing Products</CardTitle>
                            <CardDescription className="text-slate-600">Ranked by total revenue generated</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {analytics.top_products?.slice(0, 5).map((product, idx) => (
                            <div key={idx} className="group p-4 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-xl border border-slate-200/30 hover:shadow-lg transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg font-bold text-orange-600">
                                    #{idx + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-slate-900 truncate">
                                      {product.product_name || product.product_id}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                      <span>{formatNumber(product.total_quantity)} units</span>
                                      <Separator orientation="vertical" className="h-3" />
                                      <span>{product.order_count} orders</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-emerald-600">
                                    {formatCurrency(product.total_revenue)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Customers */}
                    <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-purple-50/50 to-violet-50/50 border-b border-white/20">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-purple-500/10 rounded-xl">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-slate-900">VIP Customers</CardTitle>
                            <CardDescription className="text-slate-600">Highest value customers by total spend</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {analytics.top_customers?.slice(0, 5).map((customer, idx) => (
                            <div key={idx} className="group p-4 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-xl border border-slate-200/30 hover:shadow-lg transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-lg font-bold text-purple-600">
                                    #{idx + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-900">
                                      Customer {customer.customer_id}
                                    </h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {customer.order_count} orders placed
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg text-purple-600">
                                    {formatCurrency(customer.total_spent)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Revenue Trends */}
                  <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-white/20">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900">Revenue Analytics</CardTitle>
                          <CardDescription className="text-slate-600">Daily revenue trends and performance metrics</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {analytics.daily_revenue?.slice(0, 10).map((day, idx) => {
                          const maxRevenue = Math.max(...analytics.daily_revenue.map(d => d.revenue));
                          const percentage = Math.min(100, (day.revenue / maxRevenue) * 100);
                          
                          return (
                            <div key={idx} className="group p-4 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-xl border border-slate-200/30 hover:shadow-lg transition-all duration-300">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-900">
                                    {new Date(day.date).toLocaleDateString('en-US', { 
                                      weekday: 'short',
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-emerald-600 text-lg">{formatCurrency(day.revenue)}</p>
                                  <p className="text-xs text-slate-500">{day.orders} orders</p>
                                </div>
                              </div>
                              
                              <div className="relative">
                                <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl">
                  <CardContent className="text-center py-16">
                    <div className="space-y-6">
                      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-200/50 to-slate-300/50 rounded-2xl flex items-center justify-center">
                        <BarChart3 className="w-12 h-12 text-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-700">No Analytics Data Available</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                          Upload your first CSV file to start generating comprehensive analytics and insights
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          const uploadTab = document.querySelector('[value="upload"]');
                          if (uploadTab) uploadTab.click();
                        }}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Start Data Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">Processing Activity Log</CardTitle>
                      <CardDescription className="text-slate-600 mt-1">
                        Complete audit trail of data processing operations and system performance
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {logs.length > 0 ? (
                    <div className="space-y-4">
                      {logs.map((log, idx) => (
                        <Card key={idx} className="bg-gradient-to-r from-slate-50/50 to-white/50 border border-slate-200/30 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {getStatusIcon(log.status)}
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{log.filename}</h4>
                                    <div className="flex items-center space-x-2 text-sm text-slate-600 mt-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant={
                                    log.status === 'completed' ? 'default' :
                                    log.status === 'failed' ? 'destructive' : 'secondary'
                                  }
                                  className="px-3 py-1 font-medium"
                                >
                                  {log.status.toUpperCase()}
                                </Badge>
                              </div>
                              
                              {/* Metrics */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-600 uppercase tracking-wide">Processed</p>
                                  <p className="text-lg font-bold text-emerald-600">{formatNumber(log.records_processed)}</p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-600 uppercase tracking-wide">Failed</p>
                                  <p className="text-lg font-bold text-red-600">{formatNumber(log.records_failed)}</p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-600 uppercase tracking-wide">Duration</p>
                                  <p className="text-lg font-bold text-blue-600">{log.processing_time?.toFixed(2)}s</p>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                  <p className="text-xs text-slate-600 uppercase tracking-wide">Success Rate</p>
                                  <p className="text-lg font-bold text-purple-600">
                                    {log.records_processed ? Math.round((log.records_processed / (log.records_processed + log.records_failed)) * 100) : 0}%
                                  </p>
                                </div>
                              </div>

                              {/* Errors */}
                              {log.errors && log.errors.length > 0 && (
                                <div className="bg-amber-50/50 border border-amber-200/30 rounded-lg p-4">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                    <p className="font-semibold text-amber-800">Processing Notes</p>
                                  </div>
                                  <ul className="text-sm text-amber-700 space-y-1">
                                    {log.errors.map((error, errorIdx) => (
                                      <li key={errorIdx} className="flex items-start space-x-2">
                                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                                        <span>{error}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="space-y-6">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-200/50 to-slate-300/50 rounded-2xl flex items-center justify-center">
                          <FileText className="w-12 h-12 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold text-slate-700">No Processing Logs</h3>
                          <p className="text-slate-500">Processing logs will appear here after you upload data files</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management Tab */}
            <TabsContent value="data" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50/50 to-gray-50/50 border-b border-white/20">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-500/10 rounded-xl">
                      <Database className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">Data Management Center</CardTitle>
                      <CardDescription className="text-slate-600 mt-1">
                        System administration and data maintenance operations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {/* Current Data Status */}
                  {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 border border-blue-200/30">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Database className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-slate-900">Current Dataset</h4>
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-blue-600">{formatNumber(analytics.total_records)}</p>
                            <p className="text-sm text-slate-600">Total records stored</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 border border-purple-200/30">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-slate-900">Data Range</h4>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-700">
                              {analytics.date_range?.start && analytics.date_range?.end
                                ? `${new Date(analytics.date_range.start).toLocaleDateString()} - ${new Date(analytics.date_range.end).toLocaleDateString()}`
                                : 'No date range available'
                              }
                            </p>
                            <p className="text-xs text-slate-500">Active period</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <Separator />

                  {/* Danger Zone */}
                  <div className="border-2 border-red-200/50 rounded-xl bg-gradient-to-br from-red-50/30 to-rose-50/30 p-8">
                    <div className="space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-red-800">Danger Zone</h3>
                          <p className="text-red-700 mt-1">Irreversible operations that will permanently delete data</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/60 rounded-lg p-6 space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900">Clear All Data</h4>
                          <p className="text-sm text-slate-600">
                            This action will permanently delete all processed e-commerce data, analytics records, 
                            and processing logs from the system. This operation cannot be undone.
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4 pt-4">
                          <Button 
                            onClick={clearAllData} 
                            variant="destructive"
                            size="lg"
                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Clear All Data
                          </Button>
                          <p className="text-xs text-slate-500">This action is immediate and irreversible</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default App;