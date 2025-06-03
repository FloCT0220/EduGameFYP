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

			setSuccess('Registration successful! You can now login.');
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
		<h2 className="text-2xl font-semibold mb-4 text-center">Registration</h2>
		
		{/* Error Message */}
		{error && (
			<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		)}

		{/* Success Message */}
		{success && (
			<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
				{success}
			</div>
		)}

		<form onSubmit={handleSubmit}>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label className="block mb-1 text-sm">Username</label>
					<input
					type="text"
					name="username"
					value={formData.username}
					placeholder="Enter your username"
					required
					onChange={handleChange}
					className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label className="block mb-1 text-sm">Email</label>
					<input
					type="email"
					name="email"
					value={formData.email}
					placeholder="Enter your email"
					required
					onChange={handleChange}
					className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label className="block mb-1 text-sm">Password</label>
					<input
					type="password"
					name="password"
					value={formData.password}
					placeholder="Enter your password"
					required
					onChange={handleChange}
					className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label className="block mb-1 text-sm">Confirm Password</label>
					<input
					type="password"
					name="confirmPassword"
					value={formData.confirmPassword}
					placeholder="Confirm your password"
					required
					onChange={handleChange}
					className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<div className="mt-6">
			<button
				type="submit"
				disabled={isLoading}
				className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{isLoading ? 'Registering...' : 'Register'}
			</button>
			</div>
		</form>
		</div>
	);
}
