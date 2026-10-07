import math

side_a = float(input("Enter the first side: "))
side_b = float(input("Enter the second side: "))
side_c = float(input("Enter the third side: "))

perimeter = side_a + side_b + side_c
half_perimeter = perimeter / 2

area = math.sqrt(
    half_perimeter *
    (half_perimeter - side_a) *
    (half_perimeter - side_b) *
    (half_perimeter - side_c)
)

print("Perimeter:", perimeter)
print("Half-perimeter:", half_perimeter)
print("Area:", area)
