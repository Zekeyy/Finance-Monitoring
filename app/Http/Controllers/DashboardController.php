<?php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\OtherPayable;
use App\Models\Payable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Http\Request;
use DateInterval;

class DashboardController extends Controller
{
  
    public function getFinancialData(Request $request)
{
    try {
        $period = $request->input('period', 'monthly');
        Log::info('Fetching financial data for dashboard', ['period' => $period]);
        
        $endDate = Carbon::now()->endOfDay();
        
        switch ($period) {
            case 'quarterly':
                $startDate = Carbon::now()->subMonths(11)->startOfMonth();
                $dateFormat = '%Y-%m';
                $groupBy = DB::raw('CONCAT(YEAR(date), "-Q", CEIL(MONTH(date)/3))');
                $selectFormat = DB::raw('CONCAT(YEAR(date), "-Q", CEIL(MONTH(date)/3)) as month');
                break;
            case 'yearly':
                $startDate = Carbon::now()->subYears(5)->startOfYear();
                $dateFormat = '%Y';
                $groupBy = DB::raw('YEAR(date)');
                $selectFormat = DB::raw('YEAR(date) as month');
                break;
            case 'monthly':
            default:
                $firstTransaction = Transaction::orderBy('date', 'asc')->first();
                $startDate = $firstTransaction ? Carbon::parse($firstTransaction->date)->startOfMonth() : Carbon::now()->startOfMonth();
                $dateFormat = '%Y-%m';
                $groupBy = DB::raw('DATE_FORMAT(date, "%Y-%m")');
                $selectFormat = DB::raw("DATE_FORMAT(date, '{$dateFormat}') as month");
                break;
        }
        
        Log::info('Using date range:', ['start' => $startDate, 'end' => $endDate]);
        
        // Fetch transaction data
        $transactionData = Transaction::select(
            $selectFormat,
            DB::raw('SUM(CASE WHEN cost_or_income = "Income" THEN amount ELSE 0 END) as total_income'),
            DB::raw('SUM(CASE WHEN cost_or_income = "Expenses" THEN amount ELSE 0 END) as total_cost')
        )
        ->whereBetween('date', [$startDate, $endDate])
        ->groupBy($groupBy)
        ->orderBy('month', 'asc')
        ->get()
        ->keyBy('month');
        
        $monthlyData = [];
        $current = clone $startDate;
        
        while ($current->lte($endDate)) {
            $monthKey = match ($period) {
                'quarterly' => $current->format('Y') . '-Q' . ceil($current->format('n') / 3),
                'yearly' => $current->format('Y'),
                default => $current->format('Y-m')
            };
            
            $monthlyData[$monthKey] = [
                'month' => $monthKey,
                'total_income' => 0,
                'total_cost' => 0
            ];
            
            $current->add(match ($period) {
                'quarterly' => new DateInterval('P3M'),
                'yearly' => new DateInterval('P1Y'),
                default => new DateInterval('P1M')
            });
        }
        
        foreach ($transactionData as $key => $data) {
            $monthlyData[$key]['total_income'] = $data['total_income'];
            $monthlyData[$key]['total_cost'] = $data['total_cost'];
        }
        
        $formattedData = array_values($monthlyData);
        
        if ($period === 'monthly') {
            usort($formattedData, fn($a, $b) => Carbon::parse('01 ' . $a['month'])->greaterThan(Carbon::parse('01 ' . $b['month'])) ? 1 : -1);
        } else {
            usort($formattedData, fn($a, $b) => strcmp($a['month'], $b['month']));
        }
        
        $summaryTotals = Transaction::select(
            DB::raw('SUM(CASE WHEN cost_or_income = "Income" THEN amount ELSE 0 END) as total_income'),
            DB::raw('SUM(CASE WHEN cost_or_income = "Expenses" THEN amount ELSE 0 END) as total_cost')
        )
        ->whereBetween('date', [$startDate, $endDate])
        ->first();
        
        Log::info('Financial data fetched successfully');
        
        return response()->json([
            'monthly_data' => $formattedData,
            'summary' => $summaryTotals
        ]);
    } catch (\Exception $e) {
        Log::error('Error fetching financial data:', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

   

   /**
 * Get financial data by timeframe (Monthly, Quarterly, Yearly)
 *
 * @param Request $request
 * @return \Illuminate\Http\JsonResponse
 */
public function getMonthlyData(Request $request)
{
    try {
        $timeframe = $request->query('range', 'Monthly');
        Log::info('Fetching financial data with timeframe: ' . $timeframe);

        // Determine date range based on timeframe
        $startDate = null;
        
        switch ($timeframe) {
            case 'Yearly':
                // Get last 3 years of data
                $startDate = Carbon::now()->subYears(2)->startOfYear();
                break;
            case 'Quarterly':
                // Get last 8 quarters (2 years) of data
                $startDate = Carbon::now()->subQuarters(7)->startOfQuarter();
                break;
            case 'Monthly':
            default:
                // Get last 6 months of data
                $startDate = Carbon::now()->subMonths(5)->startOfMonth();
                break;
        }
        
        Log::info('Fetching data from: ' . $startDate);

        // Get data from Transactions table
        $transactionData = Transaction::select(
            DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
            DB::raw('SUM(CASE WHEN cost_or_income = "Income" THEN amount ELSE 0 END) as income'),
            DB::raw('SUM(CASE WHEN cost_or_income = "Expenses" THEN amount ELSE 0 END) as expenses')
        )
        ->where('date', '>=', $startDate)
        ->groupBy(DB::raw('DATE_FORMAT(date, "%Y-%m")'))
        ->get()
        ->keyBy('month');

        // Get data from Otherpayables table (as income)
        $otherpayablesData = OtherPayable::select(
            DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
            DB::raw('SUM(amount_paid) as income')
        )
        ->where('date', '>=', $startDate)
        ->groupBy(DB::raw('DATE_FORMAT(date, "%Y-%m")'))
        ->get();

        // Get data from Payables table (as expenses) - EXCLUDING pending status
        $payablesData = Payable::select(
            DB::raw('DATE_FORMAT(date, "%Y-%m") as month'),
            DB::raw('SUM(amount) as expenses')
        )
        ->where('date', '>=', $startDate)
        ->where('status', '!=', 'pending') // Only include non-pending payables
        ->groupBy(DB::raw('DATE_FORMAT(date, "%Y-%m")'))
        ->get();

        // Merge the datasets
        foreach ($otherpayablesData as $record) {
            if (isset($transactionData[$record->month])) {
                $transactionData[$record->month]->income += $record->income;
            } else {
                $transactionData[$record->month] = (object)[
                    'month' => $record->month,
                    'income' => $record->income,
                    'expenses' => 0
                ];
            }
        }

        foreach ($payablesData as $record) {
            if (isset($transactionData[$record->month])) {
                $transactionData[$record->month]->expenses += $record->expenses;
            } else {
                $transactionData[$record->month] = (object)[
                    'month' => $record->month,
                    'income' => 0,
                    'expenses' => $record->expenses
                ];
            }
        }

        // Convert back to array and standardize field names
        $result = array_values($transactionData->map(function($item) {
            return [
                'month' => $item->month,
                'total_income' => $item->income,
                'total_cost' => $item->expenses
            ];
        })->toArray());

        // Sort by month
        usort($result, function($a, $b) {
            return $a['month'] <=> $b['month'];
        });

        Log::info('Financial data fetched successfully:', ['count' => count($result)]);
        return response()->json($result);

    } catch (\Exception $e) {
        Log::error('Error fetching financial data:', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}