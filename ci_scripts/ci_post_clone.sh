#!/bin/sh
# Xcode Cloud post-clone hook for FaithHub.
# Installs JS dependencies and generates ios/Pods/ before xcodebuild runs.
#
# Required because:
#   - React Native autolinking reads node_modules at `pod install` time, so JS
#     deps must be installed first.
#   - We don't commit ios/Pods/ — it's regenerated per build.
set -e

cd "$CI_PRIMARY_REPOSITORY_PATH"

# Node 22 LTS (Xcode Cloud images ship with Homebrew preinstalled).
brew install node@22
brew link --overwrite --force node@22

# CocoaPods is preinstalled on Xcode Cloud images, but reinstall to make sure
# it matches the version expected by the Podfile.
brew install cocoapods

# Install JS dependencies — uses package-lock.json for a reproducible tree.
npm ci

# Generate ios/Pods/ from the committed ios/Podfile.
cd ios
pod install
