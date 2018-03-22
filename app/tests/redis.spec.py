#! /usr/bin/env python
# -*- coding: utf-8 -*-
# vim:fenc=utf-8
#
# Copyright © 2018 fh <fh@protec.local>
#
# Distributed under terms of the MIT license.

"""

"""
import redis

r = redis.StrictRedis(host='hredis-11379.c11.us-east-1-2.ec2.cloud.redislabs.com', port=11379, db=0)
print ("set key1 123")
print (r.set('key1', '123'))
print ("get key1")
print(r.get('key1'))
