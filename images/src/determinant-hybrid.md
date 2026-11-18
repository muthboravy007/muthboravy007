# Determinants
## Exercise
Let \(A\) be a \(3\times3\) matrix with \(|A|=4\). Find:
1. \(|3A|\)
2. \(|A^{-1}|\)
3. \(|\operatorname{adj}(A)|\)
4. \(|A^{-1}+2\operatorname{adj}(A)|\)
5. \(|A^{T}|\)
6. \(|3A^{-1}|\)
7. \(|(3A)^{-1}|\)

@ink red
## Note
Let \(A\in\mathcal{M}_n\), then:
1. \(|I_n|=1\)
2. \(|A^T|=|A|\)
3. \(|\alpha A|=\alpha^n|A|\)
4. \(|AB|=|A|\times|B|\)
5. \(|A^{-1}|=\dfrac{1}{|A|}\)
6. \(\operatorname{adj}(A)=|A|\cdot A^{-1}\)
7. \(|\operatorname{adj}(A)|=|A|^{n-1}\)
\columnbreak
@ink black
## Solution
Here \(n=3\) and \(|A|=4\).
1. Rule 3 with \(\alpha=3\):
\[|3A|=3^3|A|=27\cdot4=\boxed{108}\]
2. Rule 5:
\[|A^{-1}|=\dfrac{1}{|A|}=\boxed{\tfrac14}\]
3. Rule 7:
\[|\operatorname{adj}(A)|=|A|^{3-1}=4^2=\boxed{16}\]
4. Rule 6: \(\operatorname{adj}(A)=4A^{-1}\), so
\[A^{-1}+2\operatorname{adj}(A)=9A^{-1}\]
\[|9A^{-1}|=9^3|A^{-1}|=\boxed{\tfrac{729}{4}}\]
5. Rule 2:
\[|A^T|=|A|=\boxed{4}\]
6. Rules 3 and 5:
\[|3A^{-1}|=3^3|A^{-1}|=\boxed{\tfrac{27}{4}}\]
7. Rules 5 and 3:
\[|(3A)^{-1}|=\dfrac{1}{|3A|}=\dfrac{1}{3^3|A|}=\boxed{\tfrac{1}{108}}\]
