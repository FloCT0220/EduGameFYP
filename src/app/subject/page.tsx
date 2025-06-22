import React from 'react'

export default function SubjectPage() {
    return (
		<main className="min-h-screen p-4">
			<div className="mx-auto p-6 bg-white shadow-md rounded-lg">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">🌳 Skill Trees</h1>
					<p className="text-gray-600">Choose a skill tree to start your learning journey</p>
				</div>
				
				{/* Skill Trees Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* This will be populated with actual skill trees from the API */}
					<div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-lg text-white cursor-pointer hover:shadow-lg transition-shadow">
						<div className="text-4xl mb-4">🎨</div>
						<h3 className="text-xl font-semibold mb-2">HTML & CSS Fundamentals</h3>
						<p className="text-blue-100 text-sm mb-4">Learn the building blocks of web development</p>
						<div className="flex items-center justify-between">
							<span className="text-sm">Level 1-3</span>
							<span className="text-sm">3/9 nodes</span>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 rounded-lg text-white cursor-pointer hover:shadow-lg transition-shadow">
						<div className="text-4xl mb-4">⚡</div>
						<h3 className="text-xl font-semibold mb-2">JavaScript Mastery</h3>
						<p className="text-green-100 text-sm mb-4">Master modern JavaScript and ES6+ features</p>
						<div className="flex items-center justify-between">
							<span className="text-sm">Level 1-4</span>
							<span className="text-sm">2/10 nodes</span>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-lg text-white cursor-pointer hover:shadow-lg transition-shadow">
						<div className="text-4xl mb-4">⚛️</div>
						<h3 className="text-xl font-semibold mb-2">React Framework</h3>
						<p className="text-purple-100 text-sm mb-4">Build dynamic user interfaces with React</p>
						<div className="flex items-center justify-between">
							<span className="text-sm">Level 2-4</span>
							<span className="text-sm">0/9 nodes</span>
						</div>
					</div>
					
					<div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-lg text-white cursor-pointer hover:shadow-lg transition-shadow">
						<div className="text-4xl mb-4">🔗</div>
						<h3 className="text-xl font-semibold mb-2">Backend Integration</h3>
						<p className="text-orange-100 text-sm mb-4">Connect frontend to databases and APIs</p>
						<div className="flex items-center justify-between">
							<span className="text-sm">Level 3-5</span>
							<span className="text-sm">0/8 nodes</span>
						</div>
					</div>
				</div>
			</div>
		</main>
    )
}
