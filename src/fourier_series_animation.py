# Fourier Series Animation for Underwater Robots
# This script demonstrates how the Fourier series can be used to model and stabilize underwater robot movements.

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

# Function to compute the Fourier series approximation of a periodic function
def fourier_series(func, T, n_terms, t):
    """
    Compute the Fourier series approximation of a given function.

    Parameters:
    - func: The original periodic function (callable).
    - T: The period of the function.
    - n_terms: Number of terms in the Fourier series.
    - t: Time points at which to evaluate the series.

    Returns:
    - Approximation of the function at the given time points.
    """
    omega = 2 * np.pi / T
    a0 = (2 / T) * np.trapz([func(x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
    result = a0 / 2

    for n in range(1, n_terms + 1):
        an = (2 / T) * np.trapz([func(x) * np.cos(n * omega * x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
        bn = (2 / T) * np.trapz([func(x) * np.sin(n * omega * x) for x in np.linspace(0, T, 1000)], np.linspace(0, T, 1000))
        result += an * np.cos(n * omega * t) + bn * np.sin(n * omega * t)

    return result

# Example periodic function: Simulated underwater robot oscillation
def robot_oscillation(t):
    """Simulated oscillation function for an underwater robot."""
    return np.sin(t) + 0.5 * np.sin(2 * t)

# Animation function
def animate_fourier():
    """Create an animation to visualize Fourier series stabilization."""
    T = 2 * np.pi  # Period of the oscillation
    n_terms = 10   # Number of Fourier terms
    t = np.linspace(0, 2 * T, 1000)  # Time points

    # Initialize the figure
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.set_title("Fourier Series Stabilization of Underwater Robot Movements")
    ax.set_xlabel("Time")
    ax.set_ylabel("Amplitude")
    ax.grid()

    # Original oscillation and Fourier approximation lines
    original_line, = ax.plot(t, [robot_oscillation(x) for x in t], label="Original Oscillation", linestyle="--")
    approx_line, = ax.plot([], [], label=f"Fourier Approximation ({n_terms} terms)")

    ax.legend()

    def update(frame):
        """Update function for the animation."""
        approx = fourier_series(robot_oscillation, T, frame, t)
        approx_line.set_data(t, approx)
        return approx_line,

    # Create the animation
    ani = FuncAnimation(fig, update, frames=range(1, n_terms + 1), blit=True, interval=500, repeat=True)

    plt.show()

if __name__ == "__main__":
    animate_fourier()
