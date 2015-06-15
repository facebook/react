import Options
import os
import sys

VERSION = '0.1.14'

def set_options(opt):
  opt.tool_options("compiler_cxx")

def configure(conf):
  conf.check_tool("compiler_cxx")
  conf.check_tool("node_addon")
  conf.env.set_variant("Release")

def build(bld):
  obj = bld.new_task_gen("cxx", "shlib", "node_addon")
  obj.target = "contextify"
  obj.source = "src/contextify.cc"
