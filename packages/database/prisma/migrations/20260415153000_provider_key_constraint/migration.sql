ALTER TABLE "integration_credentials"
ADD CONSTRAINT "integration_credentials_provider_key_name_check"
CHECK (
  ("provider" = 'NOVA_POSHTA' AND "key_name" = 'NOVA_POSHTA_API_KEY')
  OR
  ("provider" = 'CHECKBOX' AND "key_name" IN (
    'CHECKBOX_LICENCE_KEY',
    'CHECKBOX_TEST_LICENCE_KEY',
    'CHECKBOX_PINCODE',
    'CHECKOX_TEST_PINCODE'
  ))
);
