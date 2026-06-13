#!/bin/bash
export JWT_SECRET="myfixsecretfordevelopment"
export NODE_ENV="development"
timeout 5 node scripts/dev.js