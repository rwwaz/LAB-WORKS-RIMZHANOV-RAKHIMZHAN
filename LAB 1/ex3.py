number = int(input("Enter a three-digit number: "))

hundreds = number // 100
tens = (number // 10) % 10
units = number % 10

reverse_number = units * 100 + tens * 10 + hundreds

print("Reverse number:", reverse_number)