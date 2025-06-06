"use client";
import RoleChoice from "@/components/roleChoice";
import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        // This effect runs once when the component mounts
        const fetchData = async () => {
            try {
                const data = await fetch("/api/quiz");
                const response = data.json();
                console.log(response);
            } catch (error) {
            
                console.error("Error fetching skill_nodes:", error);
            }
        }

        fetchData()
    },[]);

return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <RoleChoice/>
        </div>
      </div>
    </main>
    );
}



