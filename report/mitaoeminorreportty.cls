\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{mitaoeminorreportty}[2026/11/24 v1.0 MITAOE Minor Project Report TY Class]

% Base class
\LoadClass[12pt,a4paper]{report}

% Essential Packages
\RequirePackage[a4paper,left=1.25in,right=1.0in,top=1.0in,bottom=1.0in]{geometry}
\RequirePackage{setspace}
\RequirePackage{titlesec}
\RequirePackage{tocloft}
\RequirePackage{fancyhdr}
\RequirePackage{graphicx}
\RequirePackage{array}

% 1.5 Line Spacing as per University Standards
\onehalfspacing

% Metadata Variables
\def\@projecttitle{}
\newcommand{\projecttitle}[1]{\def\@projecttitle{#1}}

\newcounter{studentcount}
\setcounter{studentcount}{0}
\newcommand{\student}[2]{%
  \stepcounter{studentcount}%
  \ifcase\thestudentcount
  \or
    \def\@studentone{#1}\def\@prnone{#2}%
  \or
    \def\@studenttwo{#1}\def\@prntwo{#2}%
  \or
    \def\@studentthree{#1}\def\@prnthree{#2}%
  \or
    \def\@studentfour{#1}\def\@prnfour{#2}%
  \fi
}

\def\@department{}
\newcommand{\department}[1]{\def\@department{#1}}

\def\@projectadvisor{}
\newcommand{\projectadvisor}[1]{\def\@projectadvisor{#1}}

\def\@projectcoordinator{}
\newcommand{\projectcoordinator}[1]{\def\@projectcoordinator{#1}}

\def\@dean{}
\newcommand{\dean}[1]{\def\@dean{#1}}

\def\@academicyear{}
\newcommand{\academicyear}[1]{\def\@academicyear{#1}}

% -------------------------------------------------------------
% Title Page Definition
% -------------------------------------------------------------
\renewcommand{\titlepage}{%
  \cleardoublepage
  \thispagestyle{empty}
  \begin{center}
    \vspace*{0.5cm}
    {\large \textbf{A MINOR PROJECT REPORT ON}}\\[0.8cm]
    
    {\Large \textbf{\MakeUppercase{\@projecttitle}}}\\[1.2cm]
    
    {\large \textit{Submitted in partial fulfillment of the requirements}}\\[0.2cm]
    {\large \textit{for the award of the degree of}}\\[0.5cm]
    {\large \textbf{BACHELOR OF TECHNOLOGY}}\\[0.2cm]
    {\large \textbf{IN}}\\[0.2cm]
    {\large \textbf{\MakeUppercase{\@department}}}\\[1.0cm]
    
    {\large \textbf{SUBMITTED BY}}\\[0.4cm]
    \begin{tabular}{p{7.5cm}r}
      \ifdefined\@studentone \textbf{\@studentone} & (PRN: \@prnone) \\ \fi
      \ifdefined\@studenttwo \textbf{\@studenttwo} & (PRN: \@prntwo) \\ \fi
      \ifdefined\@studentthree \textbf{\@studentthree} & (PRN: \@prnthree) \\ \fi
      \ifdefined\@studentfour \textbf{\@studentfour} & (PRN: \@prnfour) \\ \fi
    \end{tabular}\\[1.0cm]
    
    {\large \textbf{UNDER THE GUIDANCE OF}}\\[0.3cm]
    {\large \textbf{\@projectadvisor}}\\[1.0cm]
    
    \vfill
    
    % Institute details
    {\large \textbf{DEPARTMENT OF \MakeUppercase{\@department}}}\\[0.2cm]
    {\Large \textbf{MIT ACADEMY OF ENGINEERING}}\\[0.2cm]
    {\normalsize \textit{(An Autonomous Institute Affiliated to Savitribai Phule Pune University)}}\\[0.2cm]
    {\normalsize Alandi (D.), Pune -- 412105, Maharashtra, India}\\[0.4cm]
    {\large \textbf{ACADEMIC YEAR \@academicyear}}\\[0.5cm]
  \end{center}
  \newpage
}

% -------------------------------------------------------------
% Certificate Page Definition
% -------------------------------------------------------------
\newcommand{\certificate}{%
  \cleardoublepage
  \thispagestyle{empty}
  \begin{center}
    {\Large \textbf{DEPARTMENT OF \MakeUppercase{\@department}}}\\[0.2cm]
    {\LARGE \textbf{MIT ACADEMY OF ENGINEERING}}\\[0.2cm]
    {\normalsize \textit{(An Autonomous Institute Affiliated to Savitribai Phule Pune University)}}\\[0.2cm]
    {\normalsize Alandi (D.), Pune -- 412105}\\[0.8cm]
    
    {\Huge \textbf{CERTIFICATE}}\\[1.0cm]
  \end{center}

  \noindent This is to certify that the minor project report entitled:
  \begin{center}
    \textbf{``\@projecttitle''}
  \end{center}
  is a bona fide work carried out by:
  \begin{center}
    \begin{tabular}{ll}
      \ifdefined\@studentone \textbf{\@studentone} & (PRN: \@prnone) \\ \fi
      \ifdefined\@studenttwo \textbf{\@studenttwo} & (PRN: \@prntwo) \\ \fi
      \ifdefined\@studentthree \textbf{\@studentthree} & (PRN: \@prnthree) \\ \fi
      \ifdefined\@studentfour \textbf{\@studentfour} & (PRN: \@prnfour) \\ \fi
    \end{tabular}
  \end{center}
  in partial fulfillment of the requirements for the award of the degree of \textbf{Bachelor of Technology in \@department} of MIT Academy of Engineering, Pune during the academic year \textbf{\@academicyear}.
  
  \vspace{2.5cm}
  
  \noindent
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}ccc}
    \rule{4cm}{0.4pt} & \rule{4cm}{0.4pt} & \rule{4cm}{0.4pt} \\
    \textbf{\@projectadvisor} & \textbf{\@projectcoordinator} & \textbf{\@dean} \\
    Project Guide & Project Coordinator & Dean, \@department
  \end{tabular*}
  
  \vspace{2.0cm}
  \noindent
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}}cc}
    \rule{5cm}{0.4pt} & \rule{5cm}{0.4pt} \\
    \textbf{External Examiner} & \textbf{Principal} \\
    & MIT Academy of Engineering
  \end{tabular*}
}

% -------------------------------------------------------------
% Declaration Page Definition
% -------------------------------------------------------------
\newcommand{\declaration}{%
  \cleardoublepage
  \thispagestyle{empty}
  \begin{center}
    {\Huge \textbf{DECLARATION}}\\[1.2cm]
  \end{center}

  \noindent We hereby declare that the minor project report entitled \textbf{``\@projecttitle''} submitted to the \textbf{Department of \@department}, MIT Academy of Engineering, Pune, is an authentic record of our original work carried out under the supervision of \textbf{\@projectadvisor}.
  
  \vspace{0.5cm}
  \noindent To the best of our knowledge and belief, this work has not formed the basis for the award of any other Degree, Diploma, Associateship, or Fellowship of any other University or Institution.
  
  \vspace{3.0cm}
  \begin{flushright}
    \ifdefined\@studentone \textbf{\@studentone} (PRN: \@prnone) \\ \vspace{0.4cm} \fi
    \ifdefined\@studenttwo \textbf{\@studenttwo} (PRN: \@prntwo) \\ \vspace{0.4cm} \fi
    \ifdefined\@studentthree \textbf{\@studentthree} (PRN: \@prnthree) \\ \vspace{0.4cm} \fi
    \ifdefined\@studentfour \textbf{\@studentfour} (PRN: \@prnfour) \\ \vspace{0.4cm} \fi
    \vspace{0.5cm}
    Date: \today \\
    Place: Pune
  \end{flushright}
}

% Chapter Heading Formatting
\titleformat{\chapter}[display]
  {\normalfont\huge\bfseries}{\chaptertitlename\ \thechapter}{20pt}{\Huge}
\titlespacing*{\chapter}{0pt}{0pt}{40pt}

\endinput
