import requests
import sys
import uuid
from datetime import datetime, timedelta

class FlightControlAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_flight_ids = []
        self.api_key = "vuelos_paraiso_api_key_2025"  # Default API key from server.py

    def run_test(self, name, method, endpoint, expected_status, data=None, use_api_key=False, invalid_api_key=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add API key header if requested
        if use_api_key:
            if invalid_api_key:
                headers['X-API-Key'] = "invalid_key_for_testing"
            else:
                headers['X-API-Key'] = self.api_key
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.text:
                    try:
                        return success, response.json()
                    except:
                        return success, response.text
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_create_flight(self, flight_id=None, use_api_key=True):
        """Create a test flight"""
        if not flight_id:
            flight_id = str(uuid.uuid4())
        
        self.test_flight_ids.append(flight_id)
        
        # Add estimated takeoff time (30 minutes before scheduled departure)
        scheduled_departure = datetime.utcnow() + timedelta(hours=1)
        estimated_takeoff = scheduled_departure - timedelta(minutes=30)
        
        flight_data = {
            "id": flight_id,
            "pilot_name": f"Test Pilot {flight_id[:4]}",
            "passenger_name": f"Test Passenger {flight_id[:4]}",
            "status": "scheduled",
            "scheduled_departure": scheduled_departure.isoformat(),
            "estimated_takeoff": estimated_takeoff.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        success, response = self.run_test(
            "Create Flight",
            "POST",
            "webhook/flight",
            200,
            data=flight_data,
            use_api_key=use_api_key
        )
        
        return success, flight_id

    def test_update_flight_status(self, flight_id, status, use_api_key=True):
        """Update a flight's status"""
        # Add estimated takeoff time (30 minutes before scheduled departure)
        scheduled_departure = datetime.utcnow() + timedelta(hours=1)
        estimated_takeoff = scheduled_departure - timedelta(minutes=30)
        
        flight_data = {
            "id": flight_id,
            "pilot_name": f"Test Pilot {flight_id[:4]}",
            "passenger_name": f"Test Passenger {flight_id[:4]}",
            "status": status,
            "scheduled_departure": scheduled_departure.isoformat(),
            "estimated_takeoff": estimated_takeoff.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return self.run_test(
            f"Update Flight Status to {status}",
            "POST",
            "webhook/flight",
            200,
            data=flight_data,
            use_api_key=use_api_key
        )

    def test_create_position(self, flight_id, lat, lng, alt, use_api_key=True):
        """Create a position for a flight"""
        position_data = {
            "id": flight_id,
            "latitude": lat,
            "longitude": lng,
            "altitude": alt,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return self.run_test(
            "Create Position",
            "POST",
            "webhook/position",
            200,
            data=position_data,
            use_api_key=use_api_key
        )

    def test_get_flights(self):
        """Get all flights"""
        return self.run_test(
            "Get All Flights",
            "GET",
            "flights",
            200
        )

    def test_get_positions(self):
        """Get all positions"""
        return self.run_test(
            "Get All Positions",
            "GET",
            "positions",
            200
        )

    def verify_flight_in_list(self, flight_id, flights_list):
        """Verify a flight exists in the flights list"""
        self.tests_run += 1
        print(f"\n🔍 Verifying flight {flight_id} exists in flights list...")
        
        found = any(flight['id'] == flight_id for flight in flights_list)
        
        if found:
            self.tests_passed += 1
            print(f"✅ Passed - Flight {flight_id} found in list")
        else:
            print(f"❌ Failed - Flight {flight_id} not found in list")
        
        return found

    def test_webhook_without_api_key(self):
        """Test webhook endpoints without API key (should return 403)"""
        # Create a test flight without API key
        flight_id = str(uuid.uuid4())
        flight_data = {
            "id": flight_id,
            "pilot_name": f"Test Pilot {flight_id[:4]}",
            "passenger_name": f"Test Passenger {flight_id[:4]}",
            "status": "scheduled",
            "scheduled_departure": datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Test flight webhook without API key
        success_flight, _ = self.run_test(
            "Flight Webhook without API Key",
            "POST",
            "webhook/flight",
            403,  # Expect 403 Forbidden
            data=flight_data,
            use_api_key=False
        )
        
        # Test position webhook without API key
        position_data = {
            "id": flight_id,
            "latitude": 4.6097,
            "longitude": -74.0817,
            "altitude": 1000,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        success_position, _ = self.run_test(
            "Position Webhook without API Key",
            "POST",
            "webhook/position",
            403,  # Expect 403 Forbidden
            data=position_data,
            use_api_key=False
        )
        
        return success_flight and success_position
    
    def test_webhook_with_invalid_api_key(self):
        """Test webhook endpoints with invalid API key (should return 403)"""
        # Create a test flight with invalid API key
        flight_id = str(uuid.uuid4())
        flight_data = {
            "id": flight_id,
            "pilot_name": f"Test Pilot {flight_id[:4]}",
            "passenger_name": f"Test Passenger {flight_id[:4]}",
            "status": "scheduled",
            "scheduled_departure": datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Test flight webhook with invalid API key
        success_flight, _ = self.run_test(
            "Flight Webhook with Invalid API Key",
            "POST",
            "webhook/flight",
            403,  # Expect 403 Forbidden
            data=flight_data,
            use_api_key=True,
            invalid_api_key=True
        )
        
        # Test position webhook with invalid API key
        position_data = {
            "id": flight_id,
            "latitude": 4.6097,
            "longitude": -74.0817,
            "altitude": 1000,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        success_position, _ = self.run_test(
            "Position Webhook with Invalid API Key",
            "POST",
            "webhook/position",
            403,  # Expect 403 Forbidden
            data=position_data,
            use_api_key=True,
            invalid_api_key=True
        )
        
        return success_flight and success_position
    
    def verify_position_in_list(self, flight_id, positions_list):
        """Verify a position exists in the positions list"""
        self.tests_run += 1
        print(f"\n🔍 Verifying position for flight {flight_id} exists in positions list...")
        
        found = any(position['id'] == flight_id for position in positions_list)
        
        if found:
            self.tests_passed += 1
            print(f"✅ Passed - Position for flight {flight_id} found in list")
        else:
            print(f"❌ Failed - Position for flight {flight_id} not found in list")
        
        return found
        
    def verify_estimated_takeoff_in_flight(self, flight_id, flights_list):
        """Verify a flight has the estimated takeoff time field"""
        self.tests_run += 1
        print(f"\n🔍 Verifying estimated takeoff time for flight {flight_id}...")
        
        flight = next((f for f in flights_list if f['id'] == flight_id), None)
        
        if not flight:
            print(f"❌ Failed - Flight {flight_id} not found in list")
            return False
        
        if 'estimated_takeoff' not in flight or not flight['estimated_takeoff']:
            print(f"❌ Failed - Estimated takeoff time not found for flight {flight_id}")
            return False
        
        # Verify the format by parsing the datetime
        try:
            takeoff_time = datetime.fromisoformat(flight['estimated_takeoff'].replace('Z', '+00:00'))
            self.tests_passed += 1
            print(f"✅ Passed - Estimated takeoff time found: {takeoff_time}")
            return True
        except ValueError as e:
            print(f"❌ Failed - Invalid estimated takeoff time format: {e}")
            return False

def main():
    # Get the backend URL from the frontend .env file
    backend_url = "https://848a7b8f-92d5-4789-b61e-64abb84c43a1.preview.emergentagent.com"
    
    print(f"Testing Flight Control API at: {backend_url}")
    
    # Setup
    tester = FlightControlAPITester(backend_url)
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test API key authentication
    print("\n🔒 Testing API Key Authentication...")
    tester.test_webhook_without_api_key()
    tester.test_webhook_with_invalid_api_key()
    
    # Create test flights with different statuses
    flight_statuses = ["scheduled", "flying", "paused", "landed"]
    flight_ids = []
    
    for status in flight_statuses:
        success, flight_id = tester.test_create_flight()
        if success:
            flight_ids.append(flight_id)
            
            # Update the flight status
            tester.test_update_flight_status(flight_id, status)
            
            # Create a position for the flight
            # Using different coordinates for each flight
            if status == "scheduled":
                lat, lng = 4.6097, -74.0817  # Bogotá
            elif status == "flying":
                lat, lng = 4.6200, -74.0900  # Slightly north
            elif status == "paused":
                lat, lng = 4.6000, -74.0700  # Slightly south-east
            else:  # landed
                lat, lng = 4.6150, -74.0750  # Slightly north-east
                
            tester.test_create_position(flight_id, lat, lng, 1000 + (500 if status == "flying" else 0))
    
    # Get all flights and verify our test flights are included
    success, flights_response = tester.test_get_flights()
    if success:
        flights = flights_response
        print(f"\nFound {len(flights)} flights in the system")
        
        for flight_id in flight_ids:
            tester.verify_flight_in_list(flight_id, flights)
            
            # Verify estimated takeoff time is present and correctly formatted
            tester.verify_estimated_takeoff_in_flight(flight_id, flights)
    
    # Get all positions and verify our test positions are included
    success, positions_response = tester.test_get_positions()
    if success:
        positions = positions_response
        print(f"\nFound {len(positions)} positions in the system")
        
        for flight_id in flight_ids:
            tester.verify_position_in_list(flight_id, positions)
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())