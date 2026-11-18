# Determinant properties
@ink #1f3a93
## Exercise
Let A be a 3×3 matrix with |A| = 4. Find:
1. |3A|   2. |A^{-1}|   3. |adj(A)|
4. |A^{-1} + 2·adj(A)|   5. |A^T|
6. |3A^{-1}|   7. |(3A)^{-1}|

@ink red
## Note
Let A ∈ M_n (n×n matrices). Then:
1. |I_n| = 1   2. |A^T| = |A|   3. |αA| = α^n |A|
4. |AB| = |A| × |B|   5. |A^{-1}| = \frac{1}{|A|}
6. adj(A) = |A| · A^{-1}   7. |adj(A)| = |A|^{n-1}

@ink #1f3a93
## Solution
Here n = 3 and |A| = 4.
1. |3A| = 3^3 |A| = 27 · 4 = ==108==     (rule 3)
2. |A^{-1}| = \frac{1}{|A|} = ==\frac{1}{4}==     (rule 5)
3. |adj(A)| = |A|^{3-1} = 4^2 = ==16==     (rule 7)
4. By rule 6, adj(A) = |A| · A^{-1} = 4A^{-1}, so
   A^{-1} + 2·adj(A) = A^{-1} + 8A^{-1} = 9A^{-1}
   |9A^{-1}| = 9^3 |A^{-1}| = ==\frac{729}{4}==     (rules 3, 5)
5. |A^T| = |A| = ==4==     (rule 2)
6. |3A^{-1}| = 3^3 |A^{-1}| = ==\frac{27}{4}==     (rules 3, 5)
7. |(3A)^{-1}| = \frac{1}{|3A|} = \frac{1}{3^3 · |A|} = ==\frac{1}{108}==     (rules 3, 5)
