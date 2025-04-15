<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\LogoutRequest;
use App\Http\Requests\RegisterRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function login(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);
        
        // Create credentials array
        $credentials = [
            'email' => $request->email,
            'password' => $request->password
        ];
        
        $token = Auth::attempt($credentials);
        
        if(!$token) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password'
            ], 401); // This needs to be 401 to be caught properly by your React app
        }
        
        $user = Auth::user();
        return response()->json([
            'status' => 'Success',
            'user' => $user,
            'authorisation' => [
                'token' => $token,
                'type' => 'bearer',
            ]
        ]);
    }

    public function register(RegisterRequest $request)
    {
        Log::info('Register Request: ', $request->all());

        $data = $request->validated();

        try {
            $user = User::create([
                'name' => $data['name'],
                'position' => $data['position'],
                'email' => $data['email'],
                'password' => bcrypt($data['password']),
            ]);

           $token = Auth::login($user);
            return response()->json([
                'status' =>'success',
                'message' => 'User Created Successfully',
                'user' =>$user,
                'authorisation' =>[
                    'token' => $token,
                    'type' => 'bearer',
                ]
            ]);
        
        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Registration failed. Please try again.',
                'exception' => $e->getMessage()
            ], 500);
        }
    }
    public function logout()
    {
        try {
            auth()->logout(); // Logout user
            return response()->json([
                'status' => 'Success',
                'message' => 'Successfully logged out'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'Error',
                'message' => 'Logout failed'
            ], 500);
        }
    }
    
    // In your Auth controller
public function refresh()
{
    try {
       
        $newToken = Auth::refresh();
        
        return response()->json([
            'status' => 'success',
            'user' => Auth::user(),
            'authorisation' => [
                'token' => $newToken,
                'type' => 'bearer',
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid or expired refresh token',
        ], 401);
    }
}
public function userProfile()
{
    return response()->json([
        'user' => auth()->user()
    ]);
}

// Get a single user
public function show(User $user) {
    return response()->json($user);
}

public function update(Request $request, User $user)
{
    // Log the received data for debugging
    Log::info('Update Request Data:', $request->all());

    try {
        // Validate the provided fields
        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'position' => 'sometimes|required|string|max:255',
            'password' => 'sometimes|required|string|min:6',
        ]);

        // Hash the password if it's being updated
        if (isset($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        }

        // Update user with validated data
        $user->update($validatedData);

        // Return a success response
        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    } catch (\Exception $e) {
        // Log the error
        Log::error('Error updating user: ' . $e->getMessage());
        
        // Return an error response
        return response()->json([
            'success' => false,
            'message' => 'Failed to update user: ' . $e->getMessage()
        ], 500);
    }
}

/**
 * Delete the specified user.
 */
public function destroy(User $user)
{
    try {
        // Log the deletion attempt
        Log::info('Attempting to delete user:', ['user_id' => $user->id]);
        
        // Delete the user
        $user->delete();
        
        // Return a success response
        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    } catch (\Exception $e) {
        // Log the error
        Log::error('Error deleting user: ' . $e->getMessage());
        
        // Return an error response
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete user: ' . $e->getMessage()
        ], 500);
    }
}

public function index()
    {
        $users = User::all(); // Fetch all users
        return response()->json($users);
    }
}
