'use client'; // only if using in Next.js 13+ App Router

import { useState, ChangeEvent, FormEvent } from 'react';

export default function RegistrationForm() {
	const [formData, setFormData] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
	});

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		// Clear error when user starts typing
		if (error) setError('');
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');
		setSuccess('');


		// Password validation
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match');
			setIsLoading(false);
			return;
		}

		if (formData.password.length < 6) {
			setError('Password must be at least 6 characters long');
			setIsLoading(false);
			return;
		}

		try {
			console.log(formData);
			const response = await fetch('/api/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					username: formData.username,
					email: formData.email,
					password: formData.password,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || 'Registration failed');
			}

			setSuccess('Registration successful! You can now sign in.');
			// Reset form
			setFormData({
				username: '',
				email: '',
				password: '',
				confirmPassword: '',
			});

		} catch (error) {
			setError(error instanceof Error ? error.message : 'An error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-3">
					✨ Join EduQuest Today
				</h2>
				<p className="text-gray-600">
					Create your account and start your learning adventure
				</p>
			</div>

			{/* Error Message */}
			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
					<span className="mr-2">⚠️</span>
					{error}
				</div>
			)}

			{/* Success Message */}
			{success && (
				<div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
					<span className="mr-2">✅</span>
					{success}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							👤 Username
						</label>
						<input
							type="text"
							name="username"
							value={formData.username}
							placeholder="Choose a unique username"
							required
							onChange={handleChange}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							📧 Email Address
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							placeholder="Enter your email address"
							required
							onChange={handleChange}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							🔒 Password
						</label>
						<input
							type="password"
							name="password"
							value={formData.password}
							placeholder="Create a secure password (min. 6 characters)"
							required
							onChange={handleChange}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>

					<div>
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							🔐 Confirm Password
						</label>
						<input
							type="password"
							name="confirmPassword"
							value={formData.confirmPassword}
							placeholder="Re-enter your password"
							required
							onChange={handleChange}
							className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
						/>
					</div>
				</div>

				<div className="bg-blue-50 p-4 rounded-lg">
					<h4 className="font-semibold text-blue-800 mb-2">🎮 What you&apos;ll get:</h4>
					<div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
						<div className="flex items-center">
							<span className="mr-2">⭐</span>
							<span>Points & XP</span>
						</div>
						<div className="flex items-center">
							<span className="mr-2">🏆</span>
							<span>Achievements</span>
						</div>
						<div className="flex items-center">
							<span className="mr-2">🔥</span>
							<span>Learning Streaks</span>
						</div>
						<div className="flex items-center">
							<span className="mr-2">📊</span>
							<span>Progress Tracking</span>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full btn btn-success disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<span className="flex items-center justify-center">
							<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Creating account...
						</span>
					) : (
						'🚀 Create Account'
					)}
				</button>

				<div className="text-center pt-4 border-t border-gray-200">
					<span className="text-sm text-gray-600">
						Already have an account?{' '}
						<button
							type="button"
							onClick={() => window.location.reload()} // This will show the choice again
							className="text-green-600 hover:text-green-800 font-semibold transition-colors"
						>
							Sign in here
						</button>
					</span>
				</div>
			</form>
		</div>
	);
}
