import test from 'node:test'
import assert from 'node:assert/strict'
import { registerSchema, loginSchema, verifyOtpSchema, resetPasswordSchema } from './auth.js'

test('registration accepts all required student identity fields', () => {
  const result = registerSchema.safeParse({ fullName:'Aditi Sharma', email:'aditi@example.com', mobileNumber:'+91 9876543210', age:19, password:'securepass123', collegeName:'Example University', skills:['React','Python'], interests:['Hackathons'] })
  assert.equal(result.success, true)
})
test('registration rejects missing phone and age', () => {
  const result = registerSchema.safeParse({ fullName:'Aditi Sharma', email:'aditi@example.com', password:'securepass123' })
  assert.equal(result.success, false)
})
test('registration rejects short password', () => {
  assert.equal(registerSchema.safeParse({ fullName:'Aditi Sharma', email:'aditi@example.com', mobileNumber:'9876543210', age:19, password:'short', collegeName:'Example University' }).success, false)
})
test('login accepts email or mobile identifiers', () => {
  assert.equal(loginSchema.safeParse({ identifier:'aditi@example.com', password:'securepass123' }).success, true)
  assert.equal(loginSchema.safeParse({ identifier:'+919876543210', password:'securepass123' }).success, true)
})
test('OTP must be exactly six digits', () => {
  assert.equal(verifyOtpSchema.safeParse({ identifier:'aditi@example.com', otp:'123456' }).success, true)
  assert.equal(verifyOtpSchema.safeParse({ identifier:'aditi@example.com', otp:'12ab' }).success, false)
})
test('reset password schema validates token and password', () => {
  assert.equal(resetPasswordSchema.safeParse({ email:'user@example.com', token:'abc123xyz', password:'newpass123' }).success, true)
})
