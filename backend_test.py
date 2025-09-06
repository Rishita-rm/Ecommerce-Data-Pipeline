#!/usr/bin/env python3

import requests
import sys
import os
from datetime import datetime
import json

class EcommerceAPITester:
    def __init__(self, base_url="https://shop-data-system.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.sample_file_path = "/app/sample_ecommerce_data.csv"

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED")
        
        if details:
            print(f"   Details: {details}")
        print()

    def test_health_check(self):
        """Test the health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Message: {data.get('message', 'No message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Health Check (GET /api/)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Health Check (GET /api/)", False, f"Exception: {str(e)}")
            return False

    def test_analytics_empty(self):
        """Test analytics endpoint when no data exists"""
        try:
            response = requests.get(f"{self.api_url}/analytics/overview", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Records: {data.get('total_records', 0)}"
                if data.get('total_records', 0) == 0:
                    details += ", Message: " + data.get('message', 'No message')
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analytics Overview - Empty State", success, details)
            return success
            
        except Exception as e:
            self.log_test("Analytics Overview - Empty State", False, f"Exception: {str(e)}")
            return False

    def test_logs_empty(self):
        """Test logs endpoint when no logs exist"""
        try:
            response = requests.get(f"{self.api_url}/logs", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Logs count: {len(data) if isinstance(data, list) else 'Not a list'}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Processing Logs - Empty State", success, details)
            return success
            
        except Exception as e:
            self.log_test("Processing Logs - Empty State", False, f"Exception: {str(e)}")
            return False

    def test_file_upload(self):
        """Test file upload with sample CSV"""
        try:
            if not os.path.exists(self.sample_file_path):
                self.log_test("File Upload", False, f"Sample file not found: {self.sample_file_path}")
                return False
            
            with open(self.sample_file_path, 'rb') as file:
                files = {'file': ('sample_ecommerce_data.csv', file, 'text/csv')}
                response = requests.post(f"{self.api_url}/upload", files=files, timeout=30)
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Records processed: {data.get('records_processed', 0)}, " \
                         f"Records failed: {data.get('records_failed', 0)}, " \
                         f"Processing time: {data.get('processing_time', 0):.2f}s"
                if data.get('errors'):
                    details += f", Errors: {len(data['errors'])}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:300]}"
            
            self.log_test("File Upload (POST /api/upload)", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("File Upload (POST /api/upload)", False, f"Exception: {str(e)}")
            return False, {}

    def test_analytics_with_data(self):
        """Test analytics endpoint after data upload"""
        try:
            response = requests.get(f"{self.api_url}/analytics/overview", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Records: {data.get('total_records', 0)}, " \
                         f"Revenue: ${data.get('total_revenue', 0):.2f}, " \
                         f"Customers: {data.get('unique_customers', 0)}, " \
                         f"Products: {data.get('unique_products', 0)}"
                
                # Check if we have expected data structure
                has_top_products = len(data.get('top_products', [])) > 0
                has_top_customers = len(data.get('top_customers', [])) > 0
                has_daily_revenue = len(data.get('daily_revenue', [])) > 0
                
                details += f", Top products: {len(data.get('top_products', []))}, " \
                          f"Top customers: {len(data.get('top_customers', []))}, " \
                          f"Daily revenue entries: {len(data.get('daily_revenue', []))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analytics Overview - With Data", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Analytics Overview - With Data", False, f"Exception: {str(e)}")
            return False, {}

    def test_logs_with_data(self):
        """Test logs endpoint after data processing"""
        try:
            response = requests.get(f"{self.api_url}/logs", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Logs count: {len(data) if isinstance(data, list) else 'Not a list'}"
                
                if isinstance(data, list) and len(data) > 0:
                    latest_log = data[0]
                    details += f", Latest log status: {latest_log.get('status', 'Unknown')}, " \
                              f"Records processed: {latest_log.get('records_processed', 0)}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Processing Logs - With Data", success, details)
            return success
            
        except Exception as e:
            self.log_test("Processing Logs - With Data", False, f"Exception: {str(e)}")
            return False

    def test_invalid_file_upload(self):
        """Test upload with invalid file type"""
        try:
            # Create a temporary text file
            test_content = "This is not a CSV file"
            files = {'file': ('test.txt', test_content, 'text/plain')}
            response = requests.post(f"{self.api_url}/upload", files=files, timeout=10)
            
            # Should fail with 400 status
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Invalid File Upload (Non-CSV)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Invalid File Upload (Non-CSV)", False, f"Exception: {str(e)}")
            return False

    def test_clear_data(self):
        """Test clearing all data"""
        try:
            response = requests.delete(f"{self.api_url}/data/clear", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                details = f"Status: {response.status_code}, Message: {data.get('message', 'No message')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Clear All Data (DELETE /api/data/clear)", success, details)
            return success
            
        except Exception as e:
            self.log_test("Clear All Data (DELETE /api/data/clear)", False, f"Exception: {str(e)}")
            return False

    def test_analytics_after_clear(self):
        """Test analytics endpoint after clearing data"""
        try:
            response = requests.get(f"{self.api_url}/analytics/overview", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Should be empty again
                is_empty = data.get('total_records', 0) == 0
                details = f"Status: {response.status_code}, Records: {data.get('total_records', 0)}, " \
                         f"Is empty: {is_empty}"
                success = success and is_empty
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            
            self.log_test("Analytics After Clear - Should be Empty", success, details)
            return success
            
        except Exception as e:
            self.log_test("Analytics After Clear - Should be Empty", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting E-commerce Data Processing API Tests")
        print(f"🔗 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test 1: Health check
        if not self.test_health_check():
            print("❌ Health check failed. Stopping tests.")
            return False
        
        # Test 2: Empty state tests
        self.test_analytics_empty()
        self.test_logs_empty()
        
        # Test 3: File upload
        upload_success, upload_data = self.test_file_upload()
        
        if upload_success:
            # Test 4: Analytics with data
            self.test_analytics_with_data()
            
            # Test 5: Logs with data
            self.test_logs_with_data()
        
        # Test 6: Invalid file upload
        self.test_invalid_file_upload()
        
        # Test 7: Clear data
        if self.test_clear_data():
            # Test 8: Verify data is cleared
            self.test_analytics_after_clear()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main function to run tests"""
    tester = EcommerceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())