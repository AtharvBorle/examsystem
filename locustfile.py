from locust import HttpUser, task, between

class ExamSystemUser(HttpUser):
    # Simulate a student waiting 1 to 5 seconds between actions
    wait_time = between(1, 5)

    def on_start(self):
        # This function runs once when each bot starts
        # 1. Log in as our mock student to get the token
        payload = {
            "identifier": "8888888888",
            "password": "Password123"
        }
        response = self.client.post("/api/auth/login", json=payload)
        if response.status_code == 200:
            json_response = response.json()
            if json_response.get("success"):
                # Save the token
                self.token = json_response.get("token")
                # Set the authorization header for all subsequent requests
                self.headers = {"Authorization": f"Bearer {self.token}"}
            else:
                self.token = None
                self.headers = {}
        else:
            self.token = None
            self.headers = {}

    @task(1)
    def visit_homepage(self):
        # Visit the frontend home page (doesn't need headers)
        self.client.get("/")

    @task(2)
    def check_status(self):
        # Check student status using the valid session token
        if self.token:
            self.client.get("/api/student/status", headers=self.headers)
        else:
            # Fallback if login failed (will return 401 and count as a failure)
            self.client.get("/api/student/status")
