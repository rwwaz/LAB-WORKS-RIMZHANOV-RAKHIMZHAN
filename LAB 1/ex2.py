seconds = int(input("Enter seconds: "))

hours = seconds // 3600
minutes = (seconds % 3600) // 60
remaining_seconds = seconds % 60

print("Hours:", hours)
print("Minutes:", minutes)
print("Seconds:", remaining_seconds)