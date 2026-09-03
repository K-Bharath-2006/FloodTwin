# Mathematical Principles of Hydrodynamic Dam Breach Modelling

## 1. Dam Breach Outflow Formulation

### Froehlich (1995b) Peak Breach Discharge Equation
When empirical dam failure occurs, the peak breach outflow $Q_p$ ($m^3/s$) is calculated as:
$$Q_p = 0.607 \cdot V_w^{0.295} \cdot h_w^{1.24}$$
Where:
- $V_w$: Volume of water stored above breach invert at time of failure ($m^3$).
- $h_w$: Height of water above breach invert ($m$).

### Trapezoidal Breach Geometry
The breach is modeled with average breach width $B_{avg}$, bottom width $b$, and side slopes $Z$ ($1V:Z H$):
$$B_{avg} = b + Z \cdot h_w$$
The temporal opening of the breach follows linear/exponential expansion over the formation time $t_f$:
$$b(t) = B_{avg} \cdot \left(\frac{t}{t_f}\right)^\gamma \quad (t \le t_f)$$

---

## 2. 2D Shallow Water Equations (SWE / Saint-Venant)

The Depth-Averaged 2D Shallow Water Equations govern the downstream propagation of the flood wave:

### Continuity Equation
$$\frac{\partial h}{\partial t} + \frac{\partial (uh)}{\partial x} + \frac{\partial (vh)}{\partial y} = q$$

### Momentum Equations
$$\frac{\partial (uh)}{\partial t} + \frac{\partial (u^2h + \frac{1}{2}gh^2)}{\partial x} + \frac{\partial (uvh)}{\partial y} = -gh\frac{\partial z_b}{\partial x} - \frac{\tau_{bx}}{\rho}$$

$$\frac{\partial (vh)}{\partial t} + \frac{\partial (uvh)}{\partial x} + \frac{\partial (v^2h + \frac{1}{2}gh^2)}{\partial y} = -gh\frac{\partial z_b}{\partial y} - \frac{\tau_{by}}{\rho}$$

Where:
- $h(x,y,t)$: Water depth ($m$).
- $u, v$: Depth-averaged velocities in $x$ and $y$ directions ($m/s$).
- $z_b(x,y)$: Bed elevation ($m$).
- $g$: Gravitational acceleration ($9.81 \, m/s^2$).
- $\tau_{bx}, \tau_{by}$: Bed shear stresses computed via Manning's roughness coefficient $n$:
  $$\tau_{bx} = \rho g n^2 \frac{u \sqrt{u^2 + v^2}}{h^{1/3}}$$

---

## 3. Smoothed Particle Hydrodynamics (SPH)

DualSPHysics discretizes the Navier-Stokes equations using a Lagrangian particle meshless formulation:

### Density Continuity Formulation
$$\frac{d\rho_a}{dt} = \sum_b m_b (v_a - v_b) \cdot \nabla_a W_{ab}$$

### Momentum Conservation
$$\frac{dv_a}{dt} = -\sum_b m_b \left( \frac{P_a}{\rho_a^2} + \frac{P_b}{\rho_b^2} + \Pi_{ab} \right) \nabla_a W_{ab} + g$$

Where:
- $W_{ab}$: Wendland quintic kernel function.
- $\Pi_{ab}$: Monaghan artificial viscosity term to stabilize shockwaves and hydraulic bores.
- $P$: Pressure determined from Tait's weakly-compressible equation of state:
  $$P = B \left[ \left(\frac{\rho}{\rho_0}\right)^\gamma - 1 \right]$$
