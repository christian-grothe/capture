/*
  ==============================================================================

    Utils.h
    Created: 20 Jan 2024 10:29:54am
    Author:  christiangrothe

  ==============================================================================
*/

#pragma once
#include <cmath>

namespace Utils
{

  struct Signal
  {
    float left{0.0f};
    float right{0.0f};

    void operator+=(Signal const &other)
    {
      left += other.left;
      right += other.right;
    }

    void operator*=(float gain)
    {
      left *= gain;
      right *= gain;
    }
  };

  template <typename T>
  inline static T lerp(T v0, T v1, T t)
  {
    return (1 - t) * v0 + t * v1;
  }

  template <typename Float>
  inline Float cubicHermiteSpline(const Float *buffer, const Float readHead, const int size) noexcept
  {
    const auto iFloor = std::floor(readHead);
    auto i1 = static_cast<int>(iFloor);
    auto i0 = i1 - 1;
    auto i2 = i1 + 1;
    auto i3 = i1 + 2;

    if (i3 >= size)
      i3 -= size;
    if (i2 >= size)
      i2 -= size;
    if (i0 < 0)
      i0 += size;

    const auto t = readHead - iFloor;
    const auto v0 = buffer[i0];
    const auto v1 = buffer[i1];
    const auto v2 = buffer[i2];
    const auto v3 = buffer[i3];

    const auto c0 = v1;
    const auto c1 = static_cast<Float>(.5) * (v2 - v0);
    const auto c2 = v0 - static_cast<Float>(2.5) * v1 + static_cast<Float>(2.) * v2 - static_cast<Float>(.5) * v3;
    const auto c3 = static_cast<Float>(1.5) * (v1 - v2) + static_cast<Float>(.5) * (v3 - v0);

    return ((c3 * t + c2) * t + c1) * t + c0;
  }

  const float TWO_PI = 6.2831853071795864f;
  const float PI = 3.1415926535897932f;
}