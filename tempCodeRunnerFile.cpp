#include <bits/stdc++.h>
using namespace std;

// Function to check if a queen can be placed at board[row][col]
bool issafe(int row, int col, vector<vector<int>> &board, int n) {
    // Check left side in the same row
    for (int j = 0; j < col; j++) {
        if (board[row][j] == 1) return false;
    }

    // Check upper diagonal (left side)
    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 1) return false;
    }

    // Check lower diagonal (left side)
    for (int i = row, j = col; i < n && j >= 0; i++, j--) {
        if (board[i][j] == 1) return false;
    }

    return true;
}

// Function to print the board
void printboard(vector<vector<int>> &board, int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << board[i][j] << " ";
        }
        cout << endl;
    }
    cout << endl;
}

// Recursive function to solve N-Queens problem
void placequeen(vector<vector<int>> &board, int col, int n,int &count) {
    // Base case: If all queens are placed
    if (col == n) {
        printboard(board, n);
        count++;
        return;
    }

    // Consider each row in the current column
    for (int i = 0; i < n; i++) {
        if (issafe(i, col, board, n)) {
            board[i][col] = 1;  // Place the queen
            placequeen(board, col + 1, n,count);  // Recur for next column
            board[i][col] = 0;  // Backtrack
        }
    }
}

// Driver function
int main() {
    int n;
    cout << "Enter the number of queens: ";
    cin >> n;
    
    vector<vector<int>> board(n, vector<int>(n, 0));  // Initialize the board
    int count=0;
    placequeen(board, 0, n,count);
    cout<<count<<endl;
    
    return 0;
}
