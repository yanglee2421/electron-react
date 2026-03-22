cmake_minimum_required(VERSION 3.15...3.31)
project(cmake-addon)

# Include node-addon-api headers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR_RAW
        OUTPUT_STRIP_TRAILING_WHITESPACE)

# 去除可能存在的引号
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR_RAW})

add_compile_definitions(NAPI_DISABLE_CPP_EXCEPTIONS)

file(GLOB SOURCE_FILES "src/*.cpp")

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Include directories: cmake-js headers and node-addon-api headers
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC} "${NODE_ADDON_API_DIR}")

target_link_libraries(${PROJECT_NAME} PRIVATE ${CMAKE_JS_LIB})
target_compile_features(${PROJECT_NAME} PRIVATE cxx_std_17)

if(MSVC)
  target_compile_options(${PROJECT_NAME} PRIVATE /EHsc /utf-8)
  
  if(CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
    # Generate node.lib
    execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
  endif()
endif()