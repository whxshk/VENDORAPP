import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { TenantSchema } from '../database/schemas/Tenant.schema';
import { UserSchema } from '../database/schemas/User.schema';

const PLATFORM_TENANT_ID = 'sharkband-platform';
const ADMIN_EMAIL = 'tbmal7assan@gmail.com';
const ADMIN_PASSWORD = 'tttadmin';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  await mongoose.connect(databaseUrl);

  const TenantModel = mongoose.model('Tenant', TenantSchema);
  const UserModel = mongoose.model('User', UserSchema);

  await TenantModel.findOneAndUpdate(
    { _id: PLATFORM_TENANT_ID },
    {
      $setOnInsert: {
        _id: PLATFORM_TENANT_ID,
        name: 'SharkBand Platform',
        config: {},
        hasCompletedOnboarding: false,
      },
      $set: {
        isActive: true,
      },
      $unset: {
        location: '',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const user = await UserModel.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        tenantId: PLATFORM_TENANT_ID,
        email: ADMIN_EMAIL,
        name: 'TBM Admin',
        hashedPassword,
        roles: ['PLATFORM_ADMIN'],
        scopes: ['platform:*', 'admin:*'],
        isActive: true,
      },
      $setOnInsert: {
        _id: uuidv4(),
      },
      $unset: {
        customerId: '',
        passwordResetToken: '',
        passwordResetExpiry: '',
        otpCodeHash: '',
        otpCodeExpiry: '',
        otpCodePurpose: '',
        otpCodeAttempts: '',
      },
    },
    { upsert: true, new: true },
  ).exec();

  console.log('Platform admin ready:');
  console.log(`  email: ${user.email}`);
  console.log(`  tenant: ${user.tenantId}`);
  console.log(`  roles: ${(user.roles || []).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Failed to create platform admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
