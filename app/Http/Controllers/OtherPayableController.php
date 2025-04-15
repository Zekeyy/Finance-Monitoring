<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\OtherPayable;

class OtherPayableController extends Controller
{
    public function store(Request $request)
    {
        // Log the incoming request
        Log::info('Incoming Other Payable Request:', $request->all());

        $validator = Validator::make($request->all(), [
            'lab' => 'required|string',
            'city' => 'required|string',
            'address' => 'required|string',
            'date' => 'required|date',
            'amount_paid' => 'required|numeric',
            'mode_of_payment' => 'required|string',
            'account_number' => [
                'nullable',
                'regex:/^[0-9-]+$/', // Only numbers and dashes allowed
            ],
            'received_by' => [
                'required',
                'regex:/^[A-Za-z\s]+$/', // Only letters and spaces allowed
            ],
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $payable = OtherPayable::create($request->all());
            Log::info('Other Payable Saved Successfully:', ['id' => $payable->id]);
            return response()->json(['message' => 'Other payable saved successfully', 'payable' => $payable], 201);
        } catch (\Exception $e) {
            Log::error('Error saving Other Payable:', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'An error occurred while saving the payable.'], 500);
        }
    }

    /**
     * Retrieve all records from the other_payables table.
     */
    public function index(Request $request)
{
    $query = OtherPayable::query();

    // Apply date filtering if start_date and end_date are provided
    if ($request->has('start_date') && $request->has('end_date')) {
        $query->whereBetween('date', [$request->start_date, $request->end_date]);
    }

    // Paginate results
    $payables = $query->paginate(9);

    // Return response in JSON format
    return response()->json($payables);
}

    public function page(Request $request)
{
    $payables = OtherPayable::paginate(9); // Ensure pagination or use `get()`
    return response()->json($payables);
}
}
