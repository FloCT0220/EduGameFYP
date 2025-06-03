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
    <main className="min-h-screen p-4">
      <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <RoleChoice/>
      </div>
    </main>
    );
}



