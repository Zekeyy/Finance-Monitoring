<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payable;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
class PayablesController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'what_to_pay' => 'required|string|max:255',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:Pending,Paid,Others',
            'description' => 'required|string',
            'receipts' => 'nullable|file|mimes:pdf,jpeg,jpg,png|max:2048',
        ]);

        // Handle file upload
        if ($request->hasFile('receipts')) {
            $receiptPath = $request->file('receipts')->store('receipts', 'public');
            $validatedData['receipts'] = $receiptPath;
        }

        // Save the payable record
        $payable = Payable::create($validatedData);

        return response()->json(['message' => 'Payable saved successfully!', 'payable' => $payable], 201);
    }

    public function index()
    {
        $payables = Payable::all()->map(function ($payable) {
            if (!empty($payable->receipts)) {
                $payable->receipts = Storage::url($payable->receipts);
            }
            return $payable;
        });
    
        return response()->json($payables);
    }
    


    public function filterDate(Request $request)
{
    $query = Payable::query();

    if ($request->filled('start_date') && $request->filled('end_date')) {
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();

        $query->whereBetween('date', [$startDate, $endDate]);
    }

    return response()->json($query->paginate(9));
}

    public function destroy($id)
    {
        $payable = Payable::findOrFail($id);

        if ($payable->receipts) {
            Storage::disk('public')->delete($payable->receipts);
        }

        $payable->delete();

        return response()->json(['message' => 'Payable deleted successfully!']);
    }

    // In PayableController.php

    public function updateStatus(Request $request, $id)
    {
        try {
            Log::info('Request Data:', $request->all()); // Log request data for debugging
    
            // Validate request
            $validated = $request->validate([
                'status' => 'required|string|in:Pending,Paid,Cancelled,Others',
                'receipts' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5048',
            ]);
    
            // Find the payable record
            $payable = Payable::findOrFail($id);
    
            // Handle file upload if present
            if ($request->hasFile('receipts')) {
                $receiptPath = $request->file('receipts')->store('receipts', 'public');
                $payable->receipts = $receiptPath; // Ensure correct column name
            }
    
            // Update the status
            $payable->status = $validated['status'];
            $payable->save(); // ✅ Save ensures everything is stored in the database
    
            return response()->json([
                'success' => true,
                'message' => 'Status updated successfully',
                'data' => $payable
            ]);
        } catch (\Exception $e) {
            Log::error('Update Status Error: ' . $e->getMessage()); // Log error for debugging
            return response()->json([
                'success' => false,
                'message' => 'Failed to update status: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getAllPayables(Request $request)
    {
        $query = Payable::query();
    
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }
    
        // Return all transactions without pagination
        return response()->json($query->get());
    }
    
}
