#!/bin/bash
# AI Calendar App Deployment Verification Script

echo "🚀 AI Calendar App Deployment Status"
echo "===================================="

# Check if dist folder exists and has content
echo -e "\n1. Checking Build Output..."
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Build directory exists and has content"
    echo "   Files: $(find dist -type f | wc -l) files"
    echo "   Size: $(du -sh dist | cut -f1)"
else
    echo "❌ Build directory missing or empty"
fi

# Check key build files
echo -e "\n2. Verifying Build Assets..."
files=("dist/index.html" "dist/assets/index-*.js" "dist/assets/style-*.css")
for file in "${files[@]}"; do
    if ls $file 1> /dev/null 2>&1; then
        echo "✅ $(basename "$file") exists"
    else
        echo "❌ $(basename "$file") missing"
    fi
done

# Check Netlify configuration
echo -e "\n3. Checking Deployment Configuration..."
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml configuration found"
    echo "   Build command: $(grep 'command' netlify.toml | cut -d'"' -f2)"
    echo "   Publish directory: $(grep 'publish' netlify.toml | cut -d'"' -f2)"
else
    echo "❌ netlify.toml missing"
fi

# Check package.json for build scripts
echo -e "\n4. Verifying Build Scripts..."
if grep -q '"build"' package.json; then
    echo "✅ Build script exists in package.json"
else
    echo "❌ Build script missing"
fi

# Check for environment variables (don't show actual values)
echo -e "\n5. Environment Configuration..."
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  No environment file found (may be configured in Netlify)"
fi

# Check Supabase connectivity (without credentials)
echo -e "\n6. Supabase Integration..."
if grep -q "supabase" package.json; then
    echo "✅ Supabase client installed"
else
    echo "❌ Supabase client missing"
fi

echo -e "\n🎯 Deployment Readiness Summary"
echo "================================="
echo "If all checks show ✅, your app is ready for deployment!"
echo ""
echo "📝 Next Steps:"
echo "1. Push commits to trigger automatic Netlify deployment"
echo "2. Or manually deploy using: npx netlify deploy --prod --dir=dist"
echo "3. Check Netlify dashboard for deployment status"
echo "4. Test the live application"
echo ""
echo "🔗 Your enhanced AI Calendar App with Twenty features is ready! 🎉"