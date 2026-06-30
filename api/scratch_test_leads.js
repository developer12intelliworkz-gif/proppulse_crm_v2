import axios from "axios";

async function testLeads() {
  try {
    console.log("Logging in...");
    const loginRes = await axios.post("http://localhost:3001/api/auth/login", {
      email: "developer12.intelliworkz@gmail.com",
      password: "Man@1234"
    });
    
    const token = loginRes.data.token;
    console.log("Login successful! Token:", token ? "Exists" : "Missing");

    console.log("Fetching leads...");
    const leadsRes = await axios.get("http://localhost:3001/api/leads", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Success! Leads count:", leadsRes.data.data?.length);
    console.log("Pagination:", leadsRes.data.pagination);
  } catch (error) {
    console.error("Error in test script:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testLeads();
